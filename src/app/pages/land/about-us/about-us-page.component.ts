import { Component, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { BrandingService } from 'app/shared/services/branding.service';
import { environment } from 'environments/environment';
declare let gtag: any;
import { UuidService } from 'app/shared/services/uuid.service';

export interface BenchModel {
    id: string;
    name: string;
    short: string;
    family: string;
    effort: number;
    r1: number;
    r3: number;
    r5: number;
    cov: number;
    avgPos: number;
    sec: number;
    secDisplay: string;
    p1: number;
    p23: number;
    p45: number;
    p6p: number;
    color: string;
    radarDefault?: boolean;
    keyLabel?: boolean;
    isProd?: boolean;
    // En producción como modo avanzado del diagnóstico (Claude Fable 5.2, nov-2026)
    isAdvanced?: boolean;
    boldModel?: boolean;
    greenBadgeCov?: boolean;
    fastTime?: boolean;
}

@Component({
    selector: 'app-about-us-page',
    templateUrl: './about-us-page.component.html',
    styleUrls: ['./about-us-page.component.scss'],
    standalone: false
})
export class AboutUsPageComponent {

    // SaludGPT aún no tiene el análisis en profundidad: allí no se marca Fable como tal
    readonly showAdvancedBadge = !String(environment.tenantId || '').startsWith('salud-gpt');

    _startTime: any;
    myuuid: string;

    // Pipeline V5, narrative_v2 v0.2: 210 casos reales validados por un médico (150 de PubMed
    // posteriores al corte de los modelos y 60 de urgencias en español), prompt de producción
    // («5» diagnósticos), juez Gemini 3.8 Flash con graded_v3 y acierto estricto (misma
    // enfermedad). Tiempo: mediana por caso con 8 llamadas en paralelo (4 en Claude). Los 6
    // modelos de la línea base (6-nov-2026) y 17 más con la misma configuración (11-nov-2026),
    // en eval/bench/pipelines/pipeline_v5/main/output/narrative_v2/juanjo_classic_v2_n5/*__v0_2.
    readonly benchTotalCases = 210;

    readonly models: BenchModel[] = [
        { id: 'fable52', name: 'Claude Fable 5.2 low', short: 'Claude Fable 5.2', family: 'fable', effort: 1, r1: 77.1, r3: 89.5, r5: 91.4, cov: 91.4, avgPos: 1.240, sec: 14.4, secDisplay: '14,4s', p1: 162, p23: 26, p45: 4, p6p: 0, color: '#b91c1c', radarDefault: true, keyLabel: true, boldModel: true, isAdvanced: true },
        { id: 'sol61med', name: 'gpt-6.1-sol medium', short: 'gpt-6.1-sol med', family: 'sol61', effort: 2, r1: 66.7, r3: 80.5, r5: 83.8, cov: 83.8, avgPos: 1.341, sec: 20.8, secDisplay: '20,8s', p1: 140, p23: 29, p45: 7, p6p: 0, color: '#475569', radarDefault: false, keyLabel: false, boldModel: true },
        { id: 'opus55', name: 'Claude Opus 5.5 low', short: 'Claude Opus 5.5', family: 'opus55', effort: 1, r1: 66.2, r3: 82.4, r5: 85.2, cov: 85.2, avgPos: 1.346, sec: 12.8, secDisplay: '12,8s', p1: 139, p23: 34, p45: 6, p6p: 0, color: '#ef4444', radarDefault: true, keyLabel: true, boldModel: true },
        { id: 'gem4carbon', name: 'gemini-4-carbon low', short: 'gemini-4-carbon', family: 'gem4c', effort: 1, r1: 64.8, r3: 82.9, r5: 87.1, cov: 87.1, avgPos: 1.410, sec: 15.2, secDisplay: '15,2s', p1: 136, p23: 38, p45: 9, p6p: 0, color: '#1d4ed8', radarDefault: true, keyLabel: true },
        { id: 'sol61', name: 'gpt-6.1-sol low', short: 'gpt-6.1-sol ⭐', family: 'sol61', effort: 1, r1: 64.8, r3: 83.3, r5: 86.2, cov: 86.2, avgPos: 1.381, sec: 18.2, secDisplay: '18,2s', p1: 136, p23: 39, p45: 6, p6p: 0, color: '#0f172a', radarDefault: true, keyLabel: true, isProd: true, boldModel: true },
        { id: 'opus5', name: 'Claude Opus 5 low', short: 'Claude Opus 5', family: 'opus5', effort: 1, r1: 63.3, r3: 81.0, r5: 84.3, cov: 84.3, avgPos: 1.390, sec: 18.9, secDisplay: '18,9s', p1: 133, p23: 37, p45: 7, p6p: 0, color: '#f87171', radarDefault: false, keyLabel: false },
        { id: 'gem4argon', name: 'gemini-4-argon low', short: 'gemini-4-argon', family: 'gem4a', effort: 1, r1: 63.3, r3: 81.0, r5: 84.8, cov: 84.8, avgPos: 1.404, sec: 18.2, secDisplay: '18,2s', p1: 133, p23: 37, p45: 8, p6p: 0, color: '#3b82f6', radarDefault: false, keyLabel: true },
        { id: 'terra56med', name: 'gpt-5.6-terra medium', short: 'gpt-5.6-terra med', family: 'terra', effort: 2, r1: 61.0, r3: 80.5, r5: 82.9, cov: 82.9, avgPos: 1.402, sec: 9.6, secDisplay: '9,6s', p1: 128, p23: 41, p45: 5, p6p: 0, color: '#10b981', radarDefault: false, keyLabel: false },
        { id: 'terra56high', name: 'gpt-5.6-terra high', short: 'gpt-5.6-terra high', family: 'terra', effort: 3, r1: 60.5, r3: 80.5, r5: 82.9, cov: 82.9, avgPos: 1.379, sec: 12.4, secDisplay: '12,4s', p1: 127, p23: 42, p45: 5, p6p: 0, color: '#6ee7b7', radarDefault: false, keyLabel: false },
        { id: 'sonnet55', name: 'Claude Sonnet 5.5 low', short: 'Claude Sonnet 5.5', family: 'sonnet', effort: 1, r1: 59.5, r3: 76.2, r5: 78.6, cov: 78.6, avgPos: 1.370, sec: 10.3, secDisplay: '10,3s', p1: 125, p23: 35, p45: 5, p6p: 0, color: '#fb923c', radarDefault: false, keyLabel: true },
        { id: 'terra56', name: 'gpt-5.6-terra low', short: 'gpt-5.6-terra', family: 'terra', effort: 1, r1: 59.0, r3: 79.0, r5: 82.9, cov: 82.9, avgPos: 1.489, sec: 8.8, secDisplay: '8,8s', p1: 124, p23: 42, p45: 8, p6p: 0, color: '#059669', radarDefault: true, keyLabel: true },
        { id: 'terra61', name: 'gpt-6.1-terra low', short: 'gpt-6.1-terra', family: 'terra61', effort: 1, r1: 58.1, r3: 80.5, r5: 83.3, cov: 83.3, avgPos: 1.469, sec: 4.6, secDisplay: '4,6s', p1: 122, p23: 47, p45: 6, p6p: 0, color: '#0f766e', radarDefault: false, keyLabel: true, fastTime: true },
        { id: 'gpt54', name: 'gpt-5.4 low', short: 'gpt-5.4', family: 'gpt54', effort: 1, r1: 56.7, r3: 77.6, r5: 82.9, cov: 82.9, avgPos: 1.540, sec: 11.5, secDisplay: '11,5s', p1: 119, p23: 44, p45: 11, p6p: 0, color: '#2563eb', radarDefault: false, keyLabel: false },
        { id: 'grok47', name: 'grok-4.7 low', short: 'grok-4.7', family: 'grok47', effort: 1, r1: 56.7, r3: 74.8, r5: 79.0, cov: 79.0, avgPos: 1.458, sec: 20.8, secDisplay: '20,8s', p1: 119, p23: 38, p45: 9, p6p: 0, color: '#7c3aed', radarDefault: false, keyLabel: true },
        { id: 'gem38flash', name: 'gemini-3.8-flash low', short: 'gemini-3.8-flash', family: 'gem38', effort: 1, r1: 55.7, r3: 73.8, r5: 77.1, cov: 77.1, avgPos: 1.438, sec: 8.6, secDisplay: '8,6s', p1: 117, p23: 38, p45: 7, p6p: 0, color: '#0891b2', radarDefault: false, keyLabel: false },
        { id: 'luna', name: 'gpt-5.6-luna low', short: 'gpt-5.6-luna', family: 'luna', effort: 1, r1: 54.3, r3: 75.2, r5: 81.4, cov: 81.4, avgPos: 1.561, sec: 6.7, secDisplay: '6,7s', p1: 114, p23: 44, p45: 13, p6p: 0, color: '#f59e0b', radarDefault: false, keyLabel: false, fastTime: true },
        { id: 'o3', name: 'o3 high', short: 'o3 high', family: 'o3', effort: 3, r1: 53.8, r3: 71.0, r5: 76.7, cov: 76.7, avgPos: 1.559, sec: 21.8, secDisplay: '21,8s', p1: 113, p23: 36, p45: 12, p6p: 0, color: '#64748b', radarDefault: false, keyLabel: true },
        { id: 'gem31', name: 'gemini-3.1-pro-preview low', short: 'gemini-3.1-pro', family: 'gem31', effort: 1, r1: 52.9, r3: 66.7, r5: 73.3, cov: 73.3, avgPos: 1.519, sec: 13.1, secDisplay: '13,1s', p1: 111, p23: 29, p45: 14, p6p: 0, color: '#0284c7', radarDefault: false, keyLabel: false },
        { id: 'grok46', name: 'grok-4.6 low', short: 'grok-4.6', family: 'grok46', effort: 1, r1: 51.9, r3: 73.8, r5: 79.5, cov: 79.5, avgPos: 1.587, sec: 18.4, secDisplay: '18,4s', p1: 109, p23: 46, p45: 12, p6p: 0, color: '#a78bfa', radarDefault: false, keyLabel: false },
        { id: 'gem35flash', name: 'gemini-3.5-flash low', short: 'gemini-3.5-flash', family: 'gem35', effort: 1, r1: 49.5, r3: 71.0, r5: 75.7, cov: 75.7, avgPos: 1.604, sec: 5.3, secDisplay: '5,3s', p1: 104, p23: 45, p45: 10, p6p: 0, color: '#06b6d4', radarDefault: false, keyLabel: false, fastTime: true },
        { id: 'mini54', name: 'gpt-5.4-mini low', short: 'gpt-5.4-mini', family: 'mini', effort: 1, r1: 47.1, r3: 66.7, r5: 73.3, cov: 73.3, avgPos: 1.649, sec: 6.7, secDisplay: '6,7s', p1: 99, p23: 41, p45: 14, p6p: 0, color: '#ea580c', radarDefault: false, keyLabel: true, fastTime: true },
        { id: 'gem31lite', name: 'gemini-3.1-flash-lite low', short: 'gemini-3.1-flash-lite', family: 'geml', effort: 1, r1: 42.9, r3: 61.0, r5: 66.7, cov: 66.7, avgPos: 1.664, sec: 2.9, secDisplay: '2,9s', p1: 90, p23: 38, p45: 12, p6p: 0, color: '#67e8f9', radarDefault: false, keyLabel: true, fastTime: true },
        { id: 'gpt4o', name: 'gpt-4o', short: 'gpt-4o', family: 'gpt4o', effort: 1, r1: 31.0, r3: 43.8, r5: 49.0, cov: 49.0, avgPos: 1.738, sec: 6.5, secDisplay: '6,5s', p1: 65, p23: 27, p45: 11, p6p: 0, color: '#94a3b8', radarDefault: false, keyLabel: true, fastTime: true }
    ];

    paretoY: 'r1' | 'r3' | 'r5' = 'r1';
    paretoSelected: Record<string, boolean> = {};
    paretoMenuOpen = false;
    paretoSearch = '';

    radarSelected: Record<string, boolean> = {};
    radarMenuOpen = false;
    radarSearch = '';
    hoveredRadarModelId: string | null = null;

    tooltip: { visible: boolean; x: number; y: number; model: BenchModel | null } = {
        visible: false,
        x: 0,
        y: 0,
        model: null
    };

    constructor(
        public translate: TranslateService,
        public insightsService: InsightsService,
        private uuidService: UuidService,
        private brandingService: BrandingService
    ) {
        this._startTime = Date.now();
        this.myuuid = this.uuidService.getUuid();
        for (const m of this.models) {
            this.paretoSelected[m.id] = true;
            if (m.radarDefault) {
                this.radarSelected[m.id] = true;
            }
        }
    }

    @HostListener('document:click')
    closeMenus(): void {
        this.paretoMenuOpen = false;
        this.radarMenuOpen = false;
    }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    }

    lauchEvent(category: string) {
        var secs = this.getElapsedSeconds();
        try {
            if (typeof gtag === 'function') {
                gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
            }
        } catch (error) {
            this.insightsService.trackException(error);
        }
    }

    openWeb() {
        window.open('https://www.foundation29.org', '_blank');
    }

    getAboutUsGradient(): string {
        return this.brandingService.getAboutUsGradient();
    }

    getAboutUsOverlay(): string {
        return this.brandingService.getAboutUsOverlay();
    }

    isEuMode(): boolean {
        return this.brandingService.isEuMode();
    }

    // --- Interactive Pareto & Effort Chart ---

    trackByModelId(_index: number, m: BenchModel): string {
        return m.id;
    }

    trackByPolygonModelId(_index: number, item: { model: BenchModel }): string {
        return item.model.id;
    }

    toggleParetoModel(id: string): void {
        this.paretoSelected = {
            ...this.paretoSelected,
            [id]: !this.paretoSelected[id]
        };
    }

    toggleRadarModel(id: string): void {
        this.radarSelected = {
            ...this.radarSelected,
            [id]: !this.radarSelected[id]
        };
    }

    get paretoSelectedCount(): number {
        return this.models.filter(m => !!this.paretoSelected[m.id]).length;
    }

    get filteredParetoModels(): BenchModel[] {
        const q = (this.paretoSearch || '').toLowerCase().trim();
        if (!q) return this.models;
        return this.models.filter(m => m.name.toLowerCase().includes(q) || m.short.toLowerCase().includes(q));
    }

    setParetoPreset(preset: 'all' | 'top10' | 'efforts' | 'none'): void {
        const effortFams: Record<string, boolean> = { sol61: true, terra: true, luna: true, sol56: true, gem3pro: true };
        const next: Record<string, boolean> = {};
        this.models.forEach((m, idx) => {
            if (preset === 'all') next[m.id] = true;
            else if (preset === 'none') next[m.id] = false;
            else if (preset === 'top10') next[m.id] = idx < 10;
            else if (preset === 'efforts') next[m.id] = !!effortFams[m.family];
        });
        this.paretoSelected = next;
    }

    get paretoView() {
        const W = 560, H = 365, padL = 50, padR = 24, padT = 22, padB = 44;
        const plotW = W - padL - padR, plotH = H - padT - padB;
        const pts = this.models.filter(m => !!this.paretoSelected[m.id]);

        if (pts.length === 0) {
            return { empty: true, gridY: [], gridX: [], familyPaths: [], frontierPath: '', points: [], padL, padR, padT, padB, W, H, plotW, plotH };
        }

        const xVals = pts.map(m => m.sec);
        const yVals = pts.map(m => m[this.paretoY]);

        let xMin = Math.min(...xVals);
        let xMax = Math.max(...xVals);
        if (xMin === xMax) { xMin *= 0.85; xMax *= 1.15; }
        const yMin = Math.floor(Math.min(...yVals) - 1.5);
        const yMax = Math.ceil(Math.max(...yVals) + 1.2);

        const logMin = Math.log10(xMin * 0.88);
        const logMax = Math.log10(xMax * 1.12);

        const scaleX = (v: number) => padL + ((Math.log10(v) - logMin) / (logMax - logMin)) * plotW;
        const scaleY = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

        const gridY = [];
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const yv = yMin + ((yMax - yMin) * i) / ySteps;
            gridY.push({ y: scaleY(yv), label: yv.toFixed(0) + '%' });
        }

        const gridX = [3, 5, 7, 10, 15, 20, 30]
            .filter(tv => tv >= xMin * 0.85 && tv <= xMax * 1.15)
            .map(tv => ({ x: scaleX(tv), label: tv + 's' }));

        const families: Record<string, BenchModel[]> = {};
        for (const m of pts) {
            if (!families[m.family]) families[m.family] = [];
            families[m.family].push(m);
        }
        const familyPaths: { d: string; color: string }[] = [];
        for (const fam of Object.keys(families)) {
            const arr = families[fam];
            if (arr.length < 2) continue;
            arr.sort((a, b) => a.effort - b.effort);
            const d = arr.map((m, idx) => `${idx === 0 ? 'M' : 'L'}${scaleX(m.sec).toFixed(1)},${scaleY(m[this.paretoY]).toFixed(1)}`).join(' ');
            familyPaths.push({ d, color: arr[0].color });
        }

        const sortedByX = pts.slice().sort((a, b) => a.sec - b.sec);
        const frontier: BenchModel[] = [];
        let bestY = -Infinity;
        for (const m of sortedByX) {
            if (m[this.paretoY] > bestY) {
                frontier.push(m);
                bestY = m[this.paretoY];
            }
        }
        const frontierPath = frontier.length >= 2
            ? frontier.map((m, idx) => `${idx === 0 ? 'M' : 'L'}${scaleX(m.sec).toFixed(1)},${scaleY(m[this.paretoY]).toFixed(1)}`).join(' ')
            : '';

        const labelAll = pts.length <= 14;
        const rawPoints = pts.map(m => {
            const cx = scaleX(m.sec);
            const cy = scaleY(m[this.paretoY]);
            const showLabel = labelAll || !!m.keyLabel;
            return {
                model: m,
                cx,
                cy,
                r: showLabel ? 5.8 : 4.2,
                showLabel,
                lx: cx + 8,
                ly: cy + 3,
                anchor: 'start' as 'start' | 'end' | 'middle',
                leader: false
            };
        });

        // Smart label placement to avoid text-text and text-point collisions
        const occupied: { x1: number; y1: number; x2: number; y2: number }[] = [];
        for (const p of rawPoints) {
            occupied.push({ x1: p.cx - p.r - 2, y1: p.cy - p.r - 2, x2: p.cx + p.r + 2, y2: p.cy + p.r + 2 });
        }

        const candidates: { dx: number; dy: number; anchor: 'start' | 'end' | 'middle' }[] = [
            { dx: 8, dy: 3, anchor: 'start' },
            { dx: 8, dy: -8, anchor: 'start' },
            { dx: 8, dy: 13, anchor: 'start' },
            { dx: -8, dy: 3, anchor: 'end' },
            { dx: -8, dy: -8, anchor: 'end' },
            { dx: -8, dy: 13, anchor: 'end' },
            { dx: 0, dy: -12, anchor: 'middle' },
            { dx: 0, dy: 17, anchor: 'middle' },
            { dx: 10, dy: -18, anchor: 'start' },
            { dx: 10, dy: 22, anchor: 'start' },
            { dx: -10, dy: -18, anchor: 'end' },
            { dx: -10, dy: 22, anchor: 'end' },
            { dx: 12, dy: -28, anchor: 'start' },
            { dx: 12, dy: 31, anchor: 'start' },
            { dx: -12, dy: -28, anchor: 'end' },
            { dx: -12, dy: 31, anchor: 'end' }
        ];

        const labeled = rawPoints.filter(p => p.showLabel).sort((a, b) => b.cy - a.cy || a.cx - b.cx);
        for (const p of labeled) {
            const w = p.model.short.length * 5.7 + 6;
            const h = 12;
            let best = candidates[0];
            let bestScore = Infinity;

            for (const c of candidates) {
                const lx = p.cx + c.dx;
                const ly = p.cy + c.dy;
                const x1 = c.anchor === 'start' ? lx : (c.anchor === 'end' ? lx - w : lx - w / 2);
                const x2 = x1 + w;
                const y1 = ly - h + 2;
                const y2 = ly + 2;

                let pen = 0;
                if (x1 < padL + 2 || x2 > W - padR - 2) pen += 4000;
                if (y1 < padT + 2 || y2 > H - padB - 2) pen += 4000;

                for (const b of occupied) {
                    const ox = Math.max(0, Math.min(x2, b.x2) - Math.max(x1, b.x1));
                    const oy = Math.max(0, Math.min(y2, b.y2) - Math.max(y1, b.y1));
                    if (ox > 0 && oy > 0) {
                        pen += ox * oy * 25 + 600;
                    }
                }
                pen += Math.hypot(c.dx, c.dy) * 0.6;
                if (pen < bestScore) {
                    bestScore = pen;
                    best = c;
                    if (pen < 15) break;
                }
            }

            p.lx = p.cx + best.dx;
            p.ly = p.cy + best.dy;
            p.anchor = best.anchor;
            p.leader = Math.hypot(best.dx, best.dy) > 13;

            const bx1 = best.anchor === 'start' ? p.lx : (best.anchor === 'end' ? p.lx - w : p.lx - w / 2);
            occupied.push({ x1: bx1 - 2, y1: p.ly - h, x2: bx1 + w + 2, y2: p.ly + 3 });
        }

        return { empty: false, gridY, gridX, familyPaths, frontierPath, points: rawPoints, padL, padR, padT, padB, W, H, plotW, plotH };
    }

    // --- Interactive Radar Chart ---

    get radarSelectedCount(): number {
        return this.models.filter(m => !!this.radarSelected[m.id]).length;
    }

    get activeRadarModels(): BenchModel[] {
        return this.models.filter(m => !!this.radarSelected[m.id]);
    }

    get filteredRadarModels(): BenchModel[] {
        const q = (this.radarSearch || '').toLowerCase().trim();
        if (!q) return this.models;
        return this.models.filter(m => m.name.toLowerCase().includes(q) || m.short.toLowerCase().includes(q));
    }

    setRadarPreset(preset: 'default' | 'top5' | 'all' | 'none'): void {
        const next: Record<string, boolean> = {};
        this.models.forEach((m, idx) => {
            if (preset === 'all') next[m.id] = true;
            else if (preset === 'none') next[m.id] = false;
            else if (preset === 'default') next[m.id] = !!m.radarDefault;
            else if (preset === 'top5') next[m.id] = idx < 5;
        });
        this.radarSelected = next;
    }

    removeRadarModel(id: string): void {
        if (this.hoveredRadarModelId === id) {
            this.hoveredRadarModelId = null;
        }
        this.radarSelected = {
            ...this.radarSelected,
            [id]: false
        };
    }

    private percentileScore(model: BenchModel, key: 'r1' | 'r3' | 'r5' | 'cov' | 'avgPos' | 'sec', invert: boolean): number {
        const vals = this.models.map(m => m[key]);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        if (max === min) return 50;
        let norm = (model[key] - min) / (max - min);
        if (invert) norm = 1 - norm;
        return Math.round(15 + norm * 85);
    }

    get radarView() {
        const cx = 230, cy = 170, R = 116;
        const axesMeta: { key: 'r1' | 'r3' | 'cov' | 'avgPos' | 'sec' | 'r5'; i18nKey: string; invert: boolean }[] = [
            { key: 'r1', i18nKey: 'aboutUs.evaluation.evolution.benchmark2026.headingR1', invert: false },
            { key: 'r3', i18nKey: 'aboutUs.evaluation.evolution.benchmark2026.headingR3', invert: false },
            { key: 'avgPos', i18nKey: 'aboutUs.evaluation.evolution.benchmark2026.charts.axisOrder', invert: true },
            { key: 'sec', i18nKey: 'aboutUs.evaluation.evolution.benchmark2026.charts.axisSpeed', invert: true },
            { key: 'r5', i18nKey: 'aboutUs.evaluation.evolution.benchmark2026.headingR5', invert: false }
        ];

        const rings = [25, 50, 75, 100].map(lvl => {
            const r = (R * lvl) / 100;
            const points = axesMeta.map((_, i) => {
                const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axesMeta.length;
                return `${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`;
            }).join(' ');
            return { lvl, points, labelY: cy - r + 10 };
        });

        const axes = axesMeta.map((ax, i) => {
            const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axesMeta.length;
            const x2 = cx + R * Math.cos(ang);
            const y2 = cy + R * Math.sin(ang);
            const lx = cx + (R + 22) * Math.cos(ang);
            const ly = cy + (R + 17) * Math.sin(ang);
            const anchor = Math.abs(Math.cos(ang)) < 0.2 ? 'middle' : (Math.cos(ang) > 0 ? 'start' : 'end');
            return { x2, y2, lx, ly: ly + 4, anchor, i18nKey: ax.i18nKey };
        });

        const orderedModels = this.activeRadarModels.slice().sort((a, b) => {
            if (a.id === this.hoveredRadarModelId) return 1;
            if (b.id === this.hoveredRadarModelId) return -1;
            return 0;
        });

        const hasHover = !!this.hoveredRadarModelId;
        const polygons = orderedModels.map(m => {
            const isHovered = m.id === this.hoveredRadarModelId;
            const isDimmed = hasHover && !isHovered;
            const vertices = axesMeta.map((ax, i) => {
                const p = this.percentileScore(m, ax.key, ax.invert);
                const r = (R * p) / 100;
                const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axesMeta.length;
                return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
            });
            const points = vertices.map(v => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ');
            return {
                model: m,
                points,
                vertices,
                fillOpacity: isHovered ? 0.30 : (isDimmed ? 0.03 : 0.13),
                strokeOpacity: isHovered ? 1 : (isDimmed ? 0.18 : 0.9),
                strokeWidth: isHovered ? 3.2 : (isDimmed ? 1.3 : 2.2),
                dotRadius: isHovered ? 5.2 : (isDimmed ? 3 : 4)
            };
        });

        return { cx, cy, rings, axes, polygons };
    }

    showTooltip(evt: MouseEvent, model: BenchModel): void {
        let x = evt.clientX + 14;
        let y = evt.clientY + 14;
        if (typeof window !== 'undefined') {
            if (x + 280 > window.innerWidth) x = evt.clientX - 285;
            if (y + 130 > window.innerHeight) y = evt.clientY - 130;
        }
        this.tooltip = { visible: true, x, y, model };
    }

    hideTooltip(): void {
        this.tooltip.visible = false;
    }
}
