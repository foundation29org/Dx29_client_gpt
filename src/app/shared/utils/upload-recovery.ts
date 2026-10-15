const UPLOAD_FAILURE_STATUSES = [0, 408, 502, 504];
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Por debajo de 500 KB la imagen ya es ligera; comprimirla apenas ahorra tiempo de subida.
const COMPRESSIBLE_IMAGE_MIN_BYTES = 500 * 1024;
const MAX_COMPRESSED_DIMENSION_PX = 2048;
const JPEG_COMPRESSION_QUALITY = 0.85;

// SWA corta cualquier POST a los ~45 s.
// - En el primer intento con imágenes grandes (> 500 KB), anticipamos a los 10 s
//   si se ha subido < 50 % y el tiempo proyectado es >= 60 s, para ofrecer
//   comprimir sin hacerle esperar 45 s.
// - En el segundo intento (ya comprimido, p. ej. 0,8 MB) el buffer TCP del
//   navegador traga ~200 KB de golpe al instante (24-30 %) y en redes como GPRS
//   (20 Kbps) el progreso se queda congelado ahí sin avanzar. Si lleva >= 12 s
//   sin mover ni un byte (stalledMs >= 12000) o a los 15 s proyecta >= 60 s,
//   cortamos también para mostrar el aviso.
const MIN_PROJECTION_ELAPSED_IMAGE_MS = 10000;
const MIN_PROJECTION_ELAPSED_GENERAL_MS = 15000;
const STALLED_UPLOAD_TIMEOUT_MS = 12000;
const MAX_PROGRESS_RATIO_FOR_PREEMPT = 0.5;
const MIN_REMAINING_BYTES_FOR_PREEMPT = 128 * 1024;
const MIN_PROJECTED_DURATION_MS = 60000;

// Registro de archivos que ya han pasado por la reducción: evita volver a ofrecer
// el botón de reducir si la conexión es tan extrema (p. ej. GPRS 20 Kbps) que
// incluso comprimida vuelve a fallar.
const alreadyCompressedFiles = new WeakSet<File>();

export interface CompressedUploadBatch {
    files: File[];
    compressedCount: number;
    savedBytes: number;
}

export interface SlowUploadEvaluation {
    shouldPreempt: boolean;
    projectedSec: number;
}

export function evaluateSlowImageUpload(params: {
    loadedBytes: number;
    totalBytes: number;
    elapsedMs: number;
    stalledMs?: number;
    hasCompressible: boolean;
}): SlowUploadEvaluation {
    const { loadedBytes, totalBytes, elapsedMs, stalledMs = 0, hasCompressible } = params;
    if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
        return { shouldPreempt: false, projectedSec: 0 };
    }

    const safeLoaded = Math.max(0, Number(loadedBytes) || 0);
    const remainingBytes = totalBytes - safeLoaded;
    if (remainingBytes < MIN_REMAINING_BYTES_FOR_PREEMPT) {
        return { shouldPreempt: false, projectedSec: 0 };
    }

    const minElapsed = hasCompressible
        ? MIN_PROJECTION_ELAPSED_IMAGE_MS
        : MIN_PROJECTION_ELAPSED_GENERAL_MS;
    if (elapsedMs < minElapsed) {
        return { shouldPreempt: false, projectedSec: 0 };
    }

    if (stalledMs >= STALLED_UPLOAD_TIMEOUT_MS) {
        const projected = safeLoaded > 0
            ? Math.round(((totalBytes / safeLoaded) * elapsedMs) / 1000)
            : 999;
        return { shouldPreempt: true, projectedSec: Math.max(projected, 60) };
    }

    const progressRatio = safeLoaded / totalBytes;
    if (progressRatio >= MAX_PROGRESS_RATIO_FOR_PREEMPT) {
        return { shouldPreempt: false, projectedSec: 0 };
    }

    if (safeLoaded === 0) {
        return { shouldPreempt: true, projectedSec: 999 };
    }

    const projectedMs = (totalBytes / safeLoaded) * elapsedMs;
    if (projectedMs < MIN_PROJECTED_DURATION_MS) {
        return { shouldPreempt: false, projectedSec: Math.round(projectedMs / 1000) };
    }

    return {
        shouldPreempt: true,
        projectedSec: Math.round(projectedMs / 1000)
    };
}

// Distingue un corte de subida o timeout de pasarela (SWA ~45 s, red móvil caída)
// de una respuesta JSON { result: 'error' } emitida por nuestro servidor.
export function isUploadConnectionFailure(err: any): boolean {
    const status = Number(err?.status);
    if (UPLOAD_FAILURE_STATUSES.indexOf(status) === -1) {
        return false;
    }
    return !(err?.error && typeof err.error === 'object' && err.error.result === 'error');
}

export function hasCompressibleImages(files: File[]): boolean {
    if (!Array.isArray(files)) {
        return false;
    }
    return files.some(isCompressibleImage);
}

function isCompressibleImage(file: File): boolean {
    return (
        !!file &&
        !alreadyCompressedFiles.has(file) &&
        SUPPORTED_IMAGE_TYPES.indexOf(file.type) !== -1 &&
        file.size > COMPRESSIBLE_IMAGE_MIN_BYTES
    );
}

function toJpegFileName(name: string): string {
    const replaced = String(name || 'image').replace(/\.(jpe?g|png|webp)$/i, '.jpg');
    return /\.jpg$/i.test(replaced) ? replaced : `${replaced}.jpg`;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image could not be decoded in browser'));
        };
        image.src = objectUrl;
    });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });
}

async function compressSingleImage(file: File): Promise<File> {
    if (!isCompressibleImage(file)) {
        return file;
    }
    try {
        const image = await loadImageElement(file);
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        if (!width || !height) {
            return file;
        }
        const maxSide = Math.max(width, height);
        const scale = maxSide > MAX_COMPRESSED_DIMENSION_PX
            ? MAX_COMPRESSED_DIMENSION_PX / maxSide
            : 1;
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            return file;
        }
        // Fondo blanco por si la imagen original era un PNG con transparencia.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, targetWidth, targetHeight);
        context.drawImage(image, 0, 0, targetWidth, targetHeight);

        const blob = await canvasToJpegBlob(canvas, JPEG_COMPRESSION_QUALITY);
        if (!blob || blob.size === 0 || blob.size >= file.size) {
            alreadyCompressedFiles.add(file);
            return file;
        }
        const compressedFile = new File([blob], toJpegFileName(file.name), {
            type: 'image/jpeg',
            lastModified: file.lastModified
        });
        alreadyCompressedFiles.add(compressedFile);
        return compressedFile;
    } catch {
        alreadyCompressedFiles.add(file);
        return file;
    }
}

export async function compressImagesForRetry(files: File[]): Promise<CompressedUploadBatch> {
    const nextFiles: File[] = [];
    let compressedCount = 0;
    let savedBytes = 0;

    for (const file of files) {
        const next = await compressSingleImage(file);
        if (next !== file) {
            compressedCount += 1;
            savedBytes += Math.max(0, file.size - next.size);
        }
        nextFiles.push(next);
    }

    return {
        files: nextFiles,
        compressedCount,
        savedBytes
    };
}
