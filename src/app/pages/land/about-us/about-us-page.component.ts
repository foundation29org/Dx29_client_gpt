import { Component, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { BrandingService } from 'app/shared/services/branding.service';
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

    _startTime: any;
    myuuid: string;

    readonly models: BenchModel[] = [
        { id: 'gpt61sol_low', name: 'gpt-6.1-sol low', short: 'gpt-6.1-sol low', family: 'sol61', effort: 1, r1: 64.1, r3: 76.6, r5: 82.0, cov: 82.8, avgPos: 1.443, sec: 13.6, secDisplay: '13,6s', p1: 164, p23: 32, p45: 14, p6p: 2, color: '#0f172a', radarDefault: true, keyLabel: true, boldModel: true },
        { id: 'terra_low', name: 'gpt-5.6-terra low', short: 'gpt-5.6-terra low ⭐', family: 'terra', effort: 1, r1: 63.3, r3: 80.1, r5: 83.2, cov: 83.2, avgPos: 1.404, sec: 6.9, secDisplay: '6,9s', p1: 162, p23: 43, p45: 8, p6p: 0, color: '#059669', radarDefault: true, keyLabel: true, isProd: true, boldModel: true, greenBadgeCov: true, fastTime: true },
        { id: 'gpt54_full', name: 'gpt-5.4 full', short: 'gpt-5.4 full', family: 'gpt54', effort: 1, r1: 62.9, r3: 80.9, r5: 85.5, cov: 86.3, avgPos: 1.502, sec: 17.0, secDisplay: '~17s', p1: 161, p23: 46, p45: 12, p6p: 2, color: '#2563eb', radarDefault: false, keyLabel: true, greenBadgeCov: true },
        { id: 'grok46_low', name: 'grok-4.6 low', short: 'grok-4.6 low', family: 'grok', effort: 1, r1: 62.9, r3: 78.1, r5: 81.6, cov: 81.6, avgPos: 1.373, sec: 17.0, secDisplay: '17,0s', p1: 161, p23: 39, p45: 9, p6p: 0, color: '#7c3aed', radarDefault: false, keyLabel: true, boldModel: true },
        { id: 'argon_low', name: 'gemini-4-argon low', short: 'gemini-4-argon low', family: 'argon', effort: 1, r1: 62.9, r3: 75.0, r5: 80.9, cov: 80.9, avgPos: 1.473, sec: 14.8, secDisplay: '14,8s', p1: 161, p23: 31, p45: 15, p6p: 0, color: '#0284c7', radarDefault: true, keyLabel: true, boldModel: true },
        { id: 'terra_high', name: 'gpt-5.6-terra high', short: 'gpt-5.6-terra high', family: 'terra', effort: 3, r1: 62.5, r3: 80.5, r5: 84.4, cov: 85.2, avgPos: 1.477, sec: 23.0, secDisplay: '~23s', p1: 160, p23: 46, p45: 10, p6p: 2, color: '#10b981', radarDefault: false, keyLabel: false },
        { id: 'terra_med', name: 'gpt-5.6-terra medium', short: 'gpt-5.6-terra med', family: 'terra', effort: 2, r1: 62.5, r3: 79.3, r5: 84.0, cov: 84.4, avgPos: 1.491, sec: 8.4, secDisplay: '8,4s', p1: 160, p23: 43, p45: 12, p6p: 1, color: '#34d399', radarDefault: false, keyLabel: false },
        { id: 'terra_xhigh', name: 'gpt-5.6-terra xhigh', short: 'gpt-5.6-terra xhigh', family: 'terra', effort: 4, r1: 62.5, r3: 75.0, r5: 78.9, cov: 79.7, avgPos: 1.431, sec: 28.9, secDisplay: '28,9s', p1: 160, p23: 32, p45: 10, p6p: 2, color: '#6ee7b7', radarDefault: false, keyLabel: true },
        { id: 'terra61_low', name: 'gpt-6.1-terra low', short: 'gpt-6.1-terra low', family: 'terra61', effort: 1, r1: 62.5, r3: 75.0, r5: 77.3, cov: 78.1, avgPos: 1.370, sec: 4.0, secDisplay: '4,0s', p1: 160, p23: 32, p45: 6, p6p: 2, color: '#0f766e', radarDefault: false, keyLabel: true, fastTime: true },
        { id: 'astra_low', name: 'gpt-6-astra low', short: 'gpt-6-astra low', family: 'astra', effort: 1, r1: 62.1, r3: 78.5, r5: 82.0, cov: 83.2, avgPos: 1.460, sec: 32.5, secDisplay: '~32,5s', p1: 159, p23: 42, p45: 9, p6p: 3, color: '#475569', radarDefault: false, keyLabel: false },
        { id: 'gpt61sol_med', name: 'gpt-6.1-sol medium', short: 'gpt-6.1-sol med', family: 'sol61', effort: 2, r1: 62.1, r3: 75.0, r5: 79.3, cov: 80.5, avgPos: 1.456, sec: 16.6, secDisplay: '16,6s', p1: 159, p23: 33, p45: 11, p6p: 3, color: '#334155', radarDefault: false, keyLabel: true },
        { id: 'gem35flash', name: 'gemini-3.5-flash low', short: 'gemini-3.5-flash', family: 'gem35', effort: 1, r1: 62.1, r3: 75.4, r5: 75.4, cov: 75.4, avgPos: 1.223, sec: 6.1, secDisplay: '6,1s', p1: 159, p23: 34, p45: 0, p6p: 0, color: '#0d9488', radarDefault: false, keyLabel: true, boldModel: true, fastTime: true },
        { id: 'gem31pro', name: 'gemini-3.1-pro-preview low', short: 'gemini-3.1-pro', family: 'gem31', effort: 1, r1: 61.3, r3: 74.6, r5: 75.0, cov: 75.0, avgPos: 1.240, sec: 9.3, secDisplay: '9,3s', p1: 157, p23: 34, p45: 1, p6p: 0, color: '#14b8a6', radarDefault: false, keyLabel: false },
        { id: 'luna_high', name: 'gpt-5.6-luna high', short: 'gpt-5.6-luna high', family: 'luna', effort: 3, r1: 60.9, r3: 77.3, r5: 82.0, cov: 83.6, avgPos: 1.575, sec: 7.6, secDisplay: '~7,6s', p1: 156, p23: 42, p45: 12, p6p: 4, color: '#f97316', radarDefault: false, keyLabel: false },
        { id: 'sol56_med', name: 'gpt-5.6-sol medium', short: 'gpt-5.6-sol med', family: 'sol56', effort: 2, r1: 60.9, r3: 76.2, r5: 81.2, cov: 82.4, avgPos: 1.540, sec: 12.7, secDisplay: '12,7s', p1: 156, p23: 39, p45: 13, p6p: 3, color: '#d97706', radarDefault: false, keyLabel: false },
        { id: 'gem38flash', name: 'gemini-3.8-flash low', short: 'gemini-3.8-flash', family: 'gem38', effort: 1, r1: 59.8, r3: 73.8, r5: 77.7, cov: 77.7, avgPos: 1.402, sec: 4.4, secDisplay: '4,4s', p1: 153, p23: 36, p45: 10, p6p: 0, color: '#0891b2', radarDefault: false, keyLabel: false, fastTime: true },
        { id: 'gem3pro_low', name: 'gemini-3-pro-preview low', short: 'gemini-3-pro low', family: 'gem3pro', effort: 1, r1: 59.8, r3: 74.6, r5: 75.0, cov: 75.0, avgPos: 1.281, sec: 10.0, secDisplay: '~10s', p1: 153, p23: 38, p45: 1, p6p: 0, color: '#06b6d4', radarDefault: false, keyLabel: false },
        { id: 'opus5_low', name: 'claude-opus-5 low', short: 'claude-opus-5 low', family: 'claude', effort: 1, r1: 59.4, r3: 76.2, r5: 82.8, cov: 87.1, avgPos: 1.803, sec: 22.7, secDisplay: '22,7s', p1: 152, p23: 43, p45: 17, p6p: 11, color: '#dc2626', radarDefault: true, keyLabel: true, greenBadgeCov: true },
        { id: 'gem25pro', name: 'gemini-2.5-pro low', short: 'gemini-2.5-pro', family: 'gem25', effort: 1, r1: 59.4, r3: 74.2, r5: 75.4, cov: 75.4, avgPos: 1.295, sec: 28.0, secDisplay: '~28s', p1: 152, p23: 38, p45: 3, p6p: 0, color: '#64748b', radarDefault: false, keyLabel: false },
        { id: 'gem3pro_med', name: 'gemini-3-pro-preview medium', short: 'gemini-3-pro med', family: 'gem3pro', effort: 2, r1: 59.4, r3: 71.1, r5: 73.0, cov: 73.0, avgPos: 1.289, sec: 35.0, secDisplay: '~35s', p1: 152, p23: 30, p45: 5, p6p: 0, color: '#94a3b8', radarDefault: false, keyLabel: false },
        { id: 'sol56_low', name: 'gpt-5.6-sol low', short: 'gpt-5.6-sol low', family: 'sol56', effort: 1, r1: 59.0, r3: 73.8, r5: 80.5, cov: 80.9, avgPos: 1.527, sec: 14.1, secDisplay: '14,1s', p1: 151, p23: 38, p45: 17, p6p: 1, color: '#f59e0b', radarDefault: false, keyLabel: false },
        { id: 'gpt54mini', name: 'gpt-5.4-mini low', short: 'gpt-5.4-mini low', family: 'mini', effort: 1, r1: 58.2, r3: 77.3, r5: 79.3, cov: 79.7, avgPos: 1.441, sec: 4.7, secDisplay: '~5s', p1: 149, p23: 49, p45: 5, p6p: 1, color: '#ea580c', radarDefault: true, keyLabel: true },
        { id: 'gem31lite', name: 'gemini-3.1-flash-lite low', short: 'gemini-3.1-flash-lite', family: 'gemlite', effort: 1, r1: 57.8, r3: 74.6, r5: 78.1, cov: 78.1, avgPos: 1.445, sec: 2.8, secDisplay: '2,8s', p1: 148, p23: 43, p45: 9, p6p: 0, color: '#84cc16', radarDefault: false, keyLabel: true, fastTime: true },
        { id: 'gpt4o', name: 'gpt-4o low', short: 'gpt-4o low', family: 'gpt4o', effort: 1, r1: 57.4, r3: 69.9, r5: 74.6, cov: 75.0, avgPos: 1.505, sec: 9.0, secDisplay: '~8–10s', p1: 147, p23: 32, p45: 12, p6p: 1, color: '#64748b', radarDefault: false, keyLabel: false },
        { id: 'luna_low', name: 'gpt-5.6-luna low', short: 'gpt-5.6-luna low', family: 'luna', effort: 1, r1: 57.0, r3: 73.8, r5: 78.5, cov: 79.7, avgPos: 1.554, sec: 6.4, secDisplay: '6,4s', p1: 146, p23: 43, p45: 12, p6p: 3, color: '#fb923c', radarDefault: false, keyLabel: false },
        { id: 'o3_high', name: 'o3-dxgpt high', short: 'o3-dxgpt high', family: 'o3', effort: 3, r1: 56.6, r3: 74.2, r5: 80.5, cov: 80.9, avgPos: 1.614, sec: 15.9, secDisplay: '15,9s', p1: 145, p23: 45, p45: 16, p6p: 1, color: '#94a3b8', radarDefault: false, keyLabel: false },
        { id: 'luna_med', name: 'gpt-5.6-luna medium', short: 'gpt-5.6-luna med', family: 'luna', effort: 2, r1: 56.6, r3: 74.2, r5: 78.9, cov: 79.7, avgPos: 1.554, sec: 7.8, secDisplay: '7,8s', p1: 145, p23: 45, p45: 12, p6p: 2, color: '#fdba74', radarDefault: false, keyLabel: false },
        { id: 'gem25flash', name: 'gemini-2.5-flash low', short: 'gemini-2.5-flash', family: 'gem25f', effort: 1, r1: 56.6, r3: 72.7, r5: 74.2, cov: 74.2, avgPos: 1.342, sec: 21.0, secDisplay: '~21s', p1: 145, p23: 41, p45: 4, p6p: 0, color: '#cbd5e1', radarDefault: false, keyLabel: false },
        { id: 'luna_xhigh', name: 'gpt-5.6-luna xhigh', short: 'gpt-5.6-luna xhigh', family: 'luna', effort: 4, r1: 55.5, r3: 69.5, r5: 73.0, cov: 75.0, avgPos: 1.573, sec: 10.4, secDisplay: '~10,4s', p1: 142, p23: 36, p45: 9, p6p: 5, color: '#fed7aa', radarDefault: false, keyLabel: false }
    ];

    paretoY: 'r1' | 'r3' | 'cov' = 'r1';
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
            { key: 'cov', i18nKey: 'aboutUs.evaluation.evolution.benchmark2026.thCoverage', invert: false },
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
