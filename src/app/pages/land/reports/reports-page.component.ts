import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { Subscription, interval } from 'rxjs';
import { InsightsService } from 'app/shared/services/azureInsights.service';

@Component({
    selector: 'app-reports-page',
    templateUrl: './reports-page.component.html',
    styleUrls: ['./reports-page.component.scss'],
    providers: [ApiDx29ServerService]
})

export class ReportsPageComponent implements OnInit, OnDestroy {
    private subscription: Subscription = new Subscription();
    showStats: boolean = false;
    countClicks: number = 0;
    systemStatus: any = null;
    healthStatus: any = null;
    loading: boolean = true;
    loadingHealth: boolean = true;
    error: string = '';
    lastUpdate: string = '';
    refreshInterval: any;
    readonly REFRESH_INTERVAL = 10000; // 10 segundos

    constructor(
        public translate: TranslateService,
        private apiDx29ServerService: ApiDx29ServerService,
        private insightsService: InsightsService
    ) {}

    ngOnInit() {
        
    }

    callShowStats() {
        this.countClicks++;
        if (this.countClicks >= 5) {
            this.showStats = true;
            this.loadSystemStatus();
            this.loadHealthStatus();
            this.startAutoRefresh();
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval.unsubscribe();
        }
    }

    private startAutoRefresh() {
        this.refreshInterval = interval(this.REFRESH_INTERVAL).subscribe(() => {
            this.loadSystemStatus();
            this.loadHealthStatus();
        });
    }

    loadSystemStatus() {
        this.loading = true;
        this.error = '';
        
        this.subscription.add(
            this.apiDx29ServerService.getSystemStatus().subscribe(
                (res: any) => {
                    if (res.result === 'success') {
                        this.systemStatus = res.data;
                        this.lastUpdate = new Date(res.data.lastUpdate).toLocaleString();
                        this.loading = false;
                    } else {
                        this.error = this.translate.instant('generics.error try again');
                        this.loading = false;
                    }
                },
                (err) => {
                    console.error('Error loading system status:', err);
                    this.error = this.translate.instant('generics.error try again');
                    this.loading = false;
                    this.insightsService.trackException(err);
                }
            )
        );
    }

    loadHealthStatus() {
        this.loadingHealth = true;
        
        this.subscription.add(
            this.apiDx29ServerService.getHealthStatus().subscribe(
                (res: any) => {
                    console.log('Health status update:', res);
                    
                    // Verificar si la respuesta tiene el formato esperado
                    if (res.status === 'healthy' && res.checks && res.checks.queues) {
                        this.healthStatus = res;
                        
                        // Registrar información sobre el estado de las colas
                        Object.keys(res.checks.queues).forEach(region => {
                            const queueStatus = res.checks.queues[region];
                            console.log(`Queue status for region ${region}:`, queueStatus);
                            
                            if (queueStatus.queuedMessages > 0) {
                                console.log(`Region ${region} has ${queueStatus.queuedMessages} messages in queue`);
                            }
                        });
                    } else {
                        console.warn('Unexpected health status format:', res);
                    }
                    
                    this.loadingHealth = false;
                },
                (err) => {
                    console.error('Error loading health status:', err);
                    this.loadingHealth = false;
                    this.insightsService.trackException(err);
                }
            )
        );
    }

    getUtilizationClass(percentage: number): string {
        if (percentage >= 90) return 'danger';
        if (percentage >= 70) return 'warning';
        return 'success';
    }

    getStatusClass(status: string): string {
        switch (status.toLowerCase()) {
            case 'idle':
                return 'badge bg-success';
            case 'standby':
                return 'badge bg-warning';
            case 'error':
                return 'badge bg-danger';
            default:
                return 'badge bg-secondary';
        }
    }

    getHealthStatusClass(status: string): string {
        if (!status) return 'badge bg-secondary';
        
        switch (status.toLowerCase()) {
            case 'healthy':
                return 'badge bg-success';
            case 'unhealthy':
                return 'badge bg-danger';
            case 'checking':
                return 'badge bg-warning';
            case 'error':
                return 'badge bg-danger';
            default:
                return 'badge bg-secondary';
        }
    }

    formatNumber(num: number): string {
        return num.toFixed(2);
    }

    refreshData() {
        this.loadSystemStatus();
        this.loadHealthStatus();
    }
}
