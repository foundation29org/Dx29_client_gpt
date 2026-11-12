// Avance simulado de una barra de progreso mientras el servidor no manda nada (la IA
// está respondiendo): se acerca a `max` sin llegar nunca, cada vez más despacio, para que
// la barra no parezca atascada. Con tau = 20 s, a los 20 s ha recorrido el 63 % del tramo,
// a los 40 s el 86 % y a los 60 s el 95 %. Quien la usa pone `max` por debajo del
// siguiente paso real del servidor.
export class ProgressCreep {
    private timer: ReturnType<typeof setInterval> | null = null;

    constructor(
        // Recibe el valor simulado; quien la usa decide si lo pinta (no debe retroceder)
        private readonly onTick: (value: number) => void,
        // Si la barra ya no existe (popup cerrado), el avance se detiene solo
        private readonly isAlive: () => boolean,
        private readonly tauMs = 20000,
        private readonly tickMs = 700
    ) {}

    start(from: number, max: number): void {
        this.stop();
        if (from >= max) {
            return;
        }
        const startedAt = Date.now();
        this.timer = setInterval(() => {
            if (!this.isAlive()) {
                this.stop();
                return;
            }
            const elapsed = Date.now() - startedAt;
            this.onTick(max - (max - from) * Math.exp(-elapsed / this.tauMs));
        }, this.tickMs);
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
