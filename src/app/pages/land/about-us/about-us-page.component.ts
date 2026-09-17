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
        if (typeof window === 'undefined') return;

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
     * Renders the strict Track A R@1 comparison using Chart.js.
     * One representative configuration is shown per model family.
     */
    private renderTrackAChart(): void {
        const ChartCtor = (window as any).Chart;
        if (!ChartCtor || !this.trackAChartRef) return;
        const canvas = this.trackAChartRef.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const firstPositionLabel = this.translate.instant(
            'aboutUs.evaluation.evolution.benchmark2026.headingR1'
        );

        const labels = [
            'gpt-5.6-terra low ⭐',
            'gpt-5.4 full',
            'grok-4.6 low',
            'gpt-6-astra low',
            'gemini-3.5-flash low',
            'gemini-3.1-pro low',
            'gpt-5.6-sol medium',
            'gemini-3.8-flash low',
            'gemini-3-pro low',
            'gemini-2.5-pro low',
            'gpt-5.4-mini low',
            'gpt-4o',
            'o3 high',
            'gemini-2.5-flash low'
        ];

        const values = [63.3, 62.9, 62.9, 62.1, 62.1, 61.3, 60.9, 59.8, 59.8, 59.4, 58.2, 57.4, 56.6, 56.6];

        const colors = [
            '#059669',
            '#2563eb',
            '#111827',
            '#7c3aed',
            '#f59e0b',
            '#db2777',
            '#4f46e5',
            '#ea580c',
            '#0891b2',
            '#65a30d',
            '#0ea5e9',
            '#64748b',
            '#dc2626',
            '#a855f7',
        ];

        this.trackAChart = new ChartCtor(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: firstPositionLabel,
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.65,
                    base: 55,
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
                            label: (item: any) => `  ${item.dataset.label}: ${Number(item.raw).toFixed(1)}%`,
                        },
                        bodyFont: { size: 13 },
                        padding: 10,
                    }
                },
                scales: {
                    y: {
                        min: 55,
                        max: 65,
                        ticks: {
                            stepSize: 2,
                            font: { size: 11 },
                            color: '#64748b',
                            callback: (v: any) => Number(v).toFixed(0) + '%',
                        },
                        title: {
                            display: true,
                            text: firstPositionLabel,
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
