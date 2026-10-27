// Título legible de las referencias de las respuestas médicas: quita las migas de la
// URL, "[PDF]", nombres de fichero y títulos genéricos ("ficha técnica", "1 de 10") y,
// cuando el título no dice nada, lo completa con el extracto o con la URL. Funciones
// puras, sin Angular, para poder probarlas con extractos reales. Lo que depende del
// idioma (títulos genéricos, nombre del medicamento) solo cubre español e inglés; en
// otros idiomas el título se deja como llega.

const MAX_TITLE_CHARS = 140;

// Títulos que solo dicen el tipo de documento o la sección, no de qué trata.
const GENERIC_TITLES = new Set([
    'ficha tecnica',
    'prospecto',
    'introduccion',
    'resumen',
    'recomendaciones',
    'precauciones',
    'propiedades farmacocineticas',
    'documento',
    'fact sheet',
    'data sheet',
    'package leaflet',
    'summary of product characteristics',
    'introduction',
    'abstract',
    'recommendations',
    'precautions',
    'original article',
    'review article',
    'untitled',
    'document',
    'insert ref no'
]);

// Tramos de ruta que no describen el documento (contenedores, formatos, vistas).
const UNINFORMATIVE_PATH_SEGMENTS = new Set([
    'index', 'default', 'home', 'main', 'full', 'fulltext', 'abstract', 'pdf', 'html',
    'view', 'download', 'downloads', 'detail', 'details', 'article', 'articles', 'doc', 'docs',
    'document', 'documents', 'content', 'files', 'file', 'uploads', 'media', 'sites',
    'assets', 'resources', 'spl-doc', 'chapter', 'en', 'es', 'printable', 'bitstream',
    'handle', 'dochtml', 'pdfs', 'ft', 'p', 'wp-content', 'default-source', 'data', 'label',
    'services', 'spl', 'set-ids', 'description'
]);

const DOCUMENT_TAG_PREFIX = /^\[(?:pdf|xml|doc|docx|html|ppt|pptx|xls|xlsx)\]\s*/i;
const FILE_EXTENSION = /\.(?:pdf|xml|json|indd|docx?|pptx?|xlsx?|html?|aspx|php)$/i;

function normalizeKey(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[\s:.\-–—|]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseUrl(url: string): URL | null {
    try {
        return new URL(url);
    } catch {
        return null;
    }
}

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

/** Dominio sin "www." para mostrar como fuente (cima.aemps.es, nice.org.uk...). */
export function referenceSourceLabel(url: string): string {
    const parsed = parseUrl(url);
    return parsed ? parsed.hostname.replace(/^www\d*\./i, '').toLowerCase() : '';
}

function pathSegments(parsed: URL | null): string[] {
    if (!parsed) {
        return [];
    }
    return parsed.pathname
        .split('/')
        .map(segment => safeDecode(segment).trim())
        .filter(Boolean);
}

/**
 * Perplexity a veces pega al título las migas de la URL:
 * "www.cdc.gov · creutzfeldt-jakob · hcpClinical Overview of CJD". El último tramo
 * de la miga va pegado sin separador, así que se corta por el tramo de ruta real
 * de la URL más largo que encaje como prefijo.
 */
function stripBreadcrumb(title: string, parsed: URL | null): string {
    if (!parsed) {
        return title;
    }
    const parts = title.split(/\s+[›·]\s+/);
    if (parts.length < 2) {
        return title;
    }
    const host = parsed.hostname.replace(/^www\d*\./i, '').toLowerCase();

    // Variante con la miga al final: "Educational Case ... - PubMed Centralpmc.ncbi.nlm.nih.gov › articles › PMC9115716"
    const suffixStart = title.toLowerCase().lastIndexOf(host);
    if (suffixStart > 0) {
        const suffix = title.slice(suffixStart + host.length);
        if (/^(?:\s+[›·]\s+[^›·]+)+$/.test(suffix)) {
            const head = title.slice(0, suffixStart).replace(/(?:https?:\/\/)?(?:www\d*\.)?$/i, '').trim();
            if (head) {
                return head;
            }
        }
    }

    const first = parts[0].replace(/^www\d*\./i, '').toLowerCase();
    if (first !== host) {
        return title;
    }
    const glued = parts[parts.length - 1];
    const gluedLower = glued.toLowerCase();
    const segments = pathSegments(parsed).map(segment => segment.toLowerCase());
    let cut = 0;
    for (let length = 1; length < glued.length; length += 1) {
        const prefix = gluedLower.slice(0, length);
        if (segments.some(segment => segment.startsWith(prefix))) {
            cut = length;
        }
    }
    const rest = glued.slice(cut).trim();
    return rest || title;
}

function looksLikeUrl(text: string): boolean {
    return /^(?:https?:\/\/|www\.)\S+/i.test(text) || /^[\w.-]+\.[a-z]{2,}(?:\/\S*)?$/i.test(text);
}

/** Nombre de fichero sin espacios ("KINT_v99_COVER.indd") o identificador UUID. */
function isFileName(text: string): boolean {
    return (FILE_EXTENSION.test(text) && !/\s/.test(text))
        || /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i.test(text);
}

/**
 * "Ficha técnica - CIMA - aemps" es genérico (solo añade el nombre del sitio), pero
 * "Recommendations | Hearing loss in adults | NICE" no: el segundo tramo dice el tema.
 */
function isGenericTitle(title: string): boolean {
    if (GENERIC_TITLES.has(normalizeKey(title))) {
        return true;
    }
    const [first, ...rest] = title.split(/\s+[-–|]\s+/);
    return rest.length > 0
        && GENERIC_TITLES.has(normalizeKey(first))
        && rest.every(part => part.trim().split(/\s+/).length <= 2);
}

function isWeakTitle(title: string): boolean {
    if (!title || title.length < 3) {
        return true;
    }
    if (looksLikeUrl(title) || isFileName(title)) {
        return true;
    }
    // "1 de 10", "Page 2 of 7" (cabecera de página de un PDF) o una fecha suelta
    if (/^(?:p[aá]g(?:ina)?\.?\s*|page\s*)?\d+\s*(?:de|of|\/)\s*\d+$/i.test(title)) {
        return true;
    }
    if (/^\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}$/.test(title)) {
        return true;
    }
    // Cabecera de ficha técnica sin el nombre: "FICHA TÉCNICA 1. NOMBRE DEL MEDICAMENTO - Agencia..."
    if (/nombre del medicamento\s*(?:[-–|]|\.{3}|…|$)/i.test(title)) {
        return true;
    }
    return isGenericTitle(title);
}

function cleanRawTitle(rawTitle: string, parsed: URL | null): string {
    let title = String(rawTitle || '').replace(/\s+/g, ' ').trim();
    title = title.replace(DOCUMENT_TAG_PREFIX, '');
    title = stripBreadcrumb(title, parsed);
    return title
        .replace(/^microsoft (?:word|powerpoint|excel) - (.+?)(?:\.(?:docx?|pptx?|xlsx?))?$/i, '$1')
        .replace(/^cima\s*::\.\s*/i, '')
        // Texto mal codificado en origen: "Sintrom® " llega como "SintromÂ®"
        .replace(/Â(?=[®©°±·])/g, '')
        .trim();
}

function cleanExtractedName(name: string): string {
    const cleaned = name
        .replace(/\s+2\.\s.*$/, '')
        .replace(/\*+/g, '')
        .replace(/[\s.…]+$/, '')
        .trim();
    // Lo capturado no es un nombre: el apartado siguiente ("2. COMPOSICIÓN...") o el
    // sufijo del sitio ("- Agencia Española de...")
    if (/^\d+\.\s/.test(cleaned) || /^[-–|]/.test(cleaned) || cleaned.length < 3) {
        return '';
    }
    return cleaned;
}

/**
 * Nombre del medicamento: fichas técnicas y prospectos (CIMA, EMA, SmPC), cabecera
 * de las fichas de la FDA ("...needed to use MODAFINIL TABLETS safely...") o, en los
 * prospectos de CIMA, la primera línea en negrita.
 */
function extractMedicineName(snippet: string, parsed: URL | null): string {
    const smpc = snippet.match(
        /(?:nombre del medicamento|name of the medicinal product)\s*[:.]?\s*\n?\s*([^\n]{3,120})/i
    );
    if (smpc) {
        return cleanExtractedName(smpc[1]);
    }
    const fdaLabel = snippet.match(/information needed to use\s+(.{3,80}?)\s+safely and effectively/i);
    if (fdaLabel) {
        return cleanExtractedName(fdaLabel[1]);
    }
    if (parsed && /(^|\.)cima\.aemps\.es$/i.test(parsed.hostname)) {
        const firstLine = snippet.split('\n').map(line => line.trim()).find(Boolean) || '';
        const bold = firstLine.match(/^\*\*([^*]{3,100})\*\*$/);
        if (bold) {
            return cleanExtractedName(bold[1]);
        }
    }
    return '';
}

/**
 * Si el extracto empieza repitiendo el título genérico ("Fact sheet" → "Fact sheet on
 * the safety of levonorgestrel-alone..."), el título completo es esa primera frase,
 * que en los PDF suele venir partida en varias líneas.
 */
function extendGenericTitleFromSnippet(title: string, snippet: string): string {
    const key = normalizeKey(title);
    if (!key) {
        return '';
    }
    const lines = snippet.split('\n').map(line => line.replace(/^#+\s*/, '').trim()).filter(Boolean);
    let text = '';
    for (const line of lines.slice(0, 4)) {
        text = text ? `${text} ${line}` : line;
        if (/[.)]$/.test(line) || text.length > MAX_TITLE_CHARS) {
            break;
        }
    }
    const normalized = normalizeKey(text);
    if (!normalized.startsWith(`${key} `) || text.length > MAX_TITLE_CHARS) {
        return '';
    }
    return text.replace(/\*+/g, '').replace(/\.$/, '').trim();
}

/**
 * Tramo de URL legible ("Insulin-based-treatments" → "Insulin based treatments").
 * Solo vale si quedan al menos dos palabras: un tramo suelto ("cima", "label",
 * "rJQZ67gVh9Rv") casi nunca dice qué es el documento.
 */
function humanizeSegment(segment: string): string {
    const base = segment.replace(FILE_EXTENSION, '');
    if (UNINFORMATIVE_PATH_SEGMENTS.has(base.toLowerCase()) || /^[0-9a-f]{8}-[0-9a-f-]{8,}$/i.test(base)) {
        return '';
    }
    const words = base
        .replace(/[_+-]+/g, ' ')
        .split(/\s+/)
        // Fuera identificadores y números largos ("4852691821", "FT_63430", "PMC9660017");
        // los años ("2021") se quedan
        .filter(word => word && !/^\d{5,}$/.test(word) && !/^[a-z]{1,4}\d{3,}$/i.test(word))
        .join(' ')
        .trim();
    if (words.split(' ').length < 2 || !/\p{L}{3,}/u.test(words)) {
        return '';
    }
    return words.charAt(0).toUpperCase() + words.slice(1);
}

function titleFromUrlPath(parsed: URL | null): string {
    const segments = pathSegments(parsed);
    for (let index = segments.length - 1; index >= 0; index -= 1) {
        const humanized = humanizeSegment(segments[index]);
        if (humanized) {
            return humanized;
        }
    }
    return '';
}

function truncateTitle(title: string): string {
    if (title.length <= MAX_TITLE_CHARS) {
        return title;
    }
    const cut = title.slice(0, MAX_TITLE_CHARS);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/**
 * Título legible de una referencia. Orden: título limpio (sin migas, [PDF]...) si
 * dice algo; si es genérico, se completa con el extracto (nombre del medicamento o
 * frase de título); si no, el último tramo útil de la URL; y en último caso el dominio.
 */
export function buildReferenceTitle(rawTitle: string, url: string, snippet: string): string {
    const parsed = parseUrl(url);
    const cleaned = cleanRawTitle(rawTitle, parsed);
    if (!isWeakTitle(cleaned)) {
        // Un título real se deja entero aunque sea largo: la tarjeta ya lo parte en líneas
        return cleaned;
    }

    const text = String(snippet || '');
    const generic = isGenericTitle(cleaned) ? cleaned.split(/\s+[-–|]\s+/)[0].trim() : '';
    const medicineName = extractMedicineName(text, parsed) || extractMedicineName(cleaned, null);
    if (medicineName) {
        return truncateTitle(generic ? `${medicineName} — ${generic}` : medicineName);
    }

    if (generic) {
        const extended = extendGenericTitleFromSnippet(generic, text);
        if (extended) {
            return truncateTitle(extended);
        }
    }

    const fromPath = titleFromUrlPath(parsed);
    if (fromPath) {
        return truncateTitle(fromPath);
    }
    // Mejor el título genérico ("Precautions") junto al dominio que inventar uno
    if (generic) {
        return generic;
    }
    return referenceSourceLabel(url) || String(url || rawTitle || '');
}
