import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { BrandingService } from 'app/shared/services/branding.service';
declare let gtag: any;
import { UuidService } from 'app/shared/services/uuid.service';

@Component({
    selector: 'app-about-us-page',
    templateUrl: './about-us-page.component.html',
    styleUrls: ['./about-us-page.component.scss'],
    standalone: false
})

export class AboutUsPageComponent implements AfterViewInit, OnDestroy {

    _startTime: any;
    myuuid: string;

    @ViewChild('trackAChart') trackAChartRef?: ElementRef<HTMLCanvasElement>;
    private trackAChart: any = null;

    private static readonly CHARTJS_CDN =
        'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
    private static chartJsLoader: Promise<void> | null = null;


    constructor( 
        public translate: TranslateService, 
        public insightsService: InsightsService, 
        private uuidService: UuidService,
        private brandingService: BrandingService
    ) {
        this._startTime = Date.now();
        this.myuuid = this.uuidService.getUuid();
    }

    ngAfterViewInit(): void {
        this.loadChartJs()
            .then(() => this.renderTrackAChart())
            .catch(err => this.insightsService.trackException(err));
    }

    ngOnDestroy(): void {
        if (this.trackAChart) {
            try { this.trackAChart.destroy(); } catch { /* noop */ }
            this.trackAChart = null;
        }
    }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        try {
            if (typeof gtag === 'function') {
                gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
            }
        } catch (error) {
            this.insightsService.trackException(error);
        }
    }

    openWeb(){
        window.open('https://www.foundation29.org', '_blank');
    }

 

    /**
     * Obtiene el gradiente de fondo para la página About Us
     */
    getAboutUsGradient(): string {
        return this.brandingService.getAboutUsGradient();
    }

    /**
     * Obtiene el overlay de fondo para la página About Us
     */
    getAboutUsOverlay(): string {
        return this.brandingService.getAboutUsOverlay();
    }

    /**
     * Verifica si está en modo EU
     */
    isEuMode(): boolean {
        return this.brandingService.isEuMode();
    }

    /**
     * Loads Chart.js from CDN once per page lifetime.
     * Uses a static cached promise so multiple navigations don't re-inject the script.
     */
    private loadChartJs(): Promise<void> {
        if (typeof (window as any).Chart !== 'undefined') {
            return Promise.resolve();
        }
        if (AboutUsPageComponent.chartJsLoader) {
            return AboutUsPageComponent.chartJsLoader;
        }
        AboutUsPageComponent.chartJsLoader = new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>('script[data-chartjs-cdn="1"]');
            if (existing) {
                if ((window as any).Chart) {
                    resolve();
                    return;
                }
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', () => reject(new Error('Chart.js failed to load')));
                return;
            }
            const s = document.createElement('script');
            s.src = AboutUsPageComponent.CHARTJS_CDN;
            s.async = true;
            s.dataset['chartjsCdn'] = '1';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Chart.js failed to load'));
            document.head.appendChild(s);
        });
        return AboutUsPageComponent.chartJsLoader;
    }

    /**
     * Renders the Track A "avg_position" bar chart using Chart.js.
     * Mirrors the chart from eval/docs/benchmark-report.html (reversed Y axis, base = 1.72).
     */
    private renderTrackAChart(): void {
        const ChartCtor = (window as any).Chart;
        if (!ChartCtor || !this.trackAChartRef) return;
        const canvas = this.trackAChartRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const labels = [
            'gemini-3-pro ⭐',
            'gemini-2.5-pro',
            'gemini-2.5-flash',
            'grok-4.1',
            'gpt-5.4 full',
            'gpt-5.4-mini ⭐',
            'o3',
            'gpt-4o',
            'gpt-5.4-mini\n(medium)',
            'gpt-5-mini ⚠️',
            'claude-opus ⚠️'
        ];

        const values = [1.299, 1.299, 1.434, 1.448, 1.502, 1.526, 1.530, 1.545, 1.570, 1.588, 1.668];

        const colors = [
            '#059669', // gemini-3-pro
            '#10b981', // gemini-2.5-pro
            '#34d399', // gemini-2.5-flash
            '#0891b2', // grok-4.1
            '#3b82f6', // gpt-5.4 full
            '#60a5fa', // gpt-5.4-mini
            '#818cf8', // o3
            '#93c5fd', // gpt-4o
            '#f59e0b', // gpt-5.4-mini medium
            '#f97316', // gpt-5-mini
            '#ef4444', // claude-opus
        ];

        this.trackAChart = new ChartCtor(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.65,
                    base: 1.72,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items: any[]) => items[0].label.replace('\n', ' '),
                            label: (item: any) => '  avg_position: ' + Number(item.raw).toFixed(3) + '  (↓ better)',
                        },
                        bodyFont: { size: 13 },
                        padding: 10,
                    }
                },
                scales: {
                    y: {
                        reverse: true,
                        min: 1.25,
                        max: 1.72,
                        ticks: {
                            stepSize: 0.05,
                            font: { size: 11 },
                            color: '#64748b',
                            callback: (v: any) => Number(v).toFixed(2),
                        },
                        title: {
                            display: true,
                            text: 'avg_position  (↓ better)',
                            font: { size: 11 },
                            color: '#64748b',
                        },
                        grid: { color: '#f1f5f9' },
                    },
                    x: {
                        ticks: {
                            font: { size: 11 },
                            color: '#334155',
                            maxRotation: 30,
                            minRotation: 15,
                        },
                        grid: { display: false },
                    }
                }
            }
        });
    }

}
