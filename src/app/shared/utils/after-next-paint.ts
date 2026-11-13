// Espera a que el navegador pinte el frame actual. Para toques que montan una pantalla pesada
// (modal, respuesta, análisis): el INP mide del toque al siguiente pintado, así que pintando
// antes la respuesta al toque, el render pesado queda fuera. El usuario lo ve un frame después.
// En una pestaña o un iframe ocultos no llega requestAnimationFrame: a los 100 ms sigue igualmente.
export function afterNextPaint(): Promise<void> {
    return new Promise<void>(resolve => {
        let resolved = false;
        const done = () => {
            if (!resolved) {
                resolved = true;
                resolve();
            }
        };
        requestAnimationFrame(() => setTimeout(done));
        setTimeout(done, 100);
    });
}
