import {
    Component,
    ElementRef,
    Inject,
    OnDestroy,
    OnInit,
    PLATFORM_ID,
    ViewChild
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { EventsService } from 'app/shared/services/events.service';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { AnalyticsService } from 'app/shared/services/analytics.service';
import { UuidService } from 'app/shared/services/uuid.service';
import { LangService } from 'app/shared/services/lang.service';
import { IframeParams, IframeParamsService } from 'app/shared/services/iframe-params.service';
import { MedicalInfoModalComponent } from '../medical-info-modal/medical-info-modal.component';

@Component({
    selector: 'app-beta-page',
    templateUrl: './beta-page.component.html',
    styleUrls: ['./beta-page.component.scss'],
    providers: [ApiDx29ServerService],
    standalone: false
})
export class BetaPageComponent implements OnInit, OnDestroy {
    @ViewChild('autoajustable') textArea?: ElementRef<HTMLTextAreaElement>;

    medicalTextOriginal = '';
    medicalTextEng = '';
    callingAI = false;
    showBetaDetails = false;
    terms2 = false;
    lang = 'en';
    timezone = '';
    model = 'gpt56terra';
    textareaPlaceholder = '';
    iframeParams: IframeParams = {};
    isInIframe = false;

    private readonly subscriptions = new Subscription();
    private activeRequest?: Subscription;
    private modalReference?: NgbModalRef;
    private fullPlaceholderText = '';
    private typingInterval?: ReturnType<typeof setInterval>;
    private queueStatusTimeout?: ReturnType<typeof setTimeout>;
    private countdownInterval?: ReturnType<typeof setInterval>;
    private currentTicketId?: string;
    private currentPosition?: number;
    private queueStartedAt?: number;
    private totalWaitTimeMs?: number;
    private webSocket: WebSocket | null = null;
    private isWebSocketConnected = false;
    private readonly startedAt = Date.now();
    private readonly myuuid: string;
    private submittedQuestion = '';

    constructor(
        public translate: TranslateService,
        private readonly modalService: NgbModal,
        private readonly apiDx29ServerService: ApiDx29ServerService,
        private readonly eventsService: EventsService,
        public readonly insightsService: InsightsService,
        private readonly analyticsService: AnalyticsService,
        private readonly router: Router,
        private readonly uuidService: UuidService,
        private readonly iframeParamsService: IframeParamsService,
        @Inject(PLATFORM_ID) private readonly platformId: Object
    ) {
        this.myuuid = this.uuidService.getUuid();
        this.lang = isPlatformBrowser(this.platformId)
            ? LangService.getValidLangFromStorage()
            : 'en';
    }

    ngOnInit(): void {
        this.eventsService.broadcast('hasDiagnostics', false);
        this.fullPlaceholderText = this.translate.instant('beta.placeholder');

        if (isPlatformBrowser(this.platformId)) {
            this.lauchEvent('Init Page');
            this.loadTimezone();
            this.isInIframe = this.iframeParamsService.getIsInIframe();
            this.analyticsService.trackPageView('Medical Questions Page', {
                isInIframe: this.isInIframe
            });
        }

        this.subscriptions.add(
            this.iframeParamsService.params$.subscribe(params => {
                this.iframeParams = params;
                if (params.medicalText) {
                    this.medicalTextOriginal = params.medicalText;
                    setTimeout(() => {
                        this.resizeTextArea();
                        document.getElementById('hiddenCheckPopupButton')?.click();
                    }, 500);
                }
                if (Object.keys(params).length > 0) {
                    this.trackParametersReceived(params);
                }
            })
        );

        this.subscribeToLanguageEvents();

        if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => {
                this.fullPlaceholderText = this.translate.instant('beta.placeholder');
                if (this.consumePendingInput()) {
                    this.resizeTextArea();
                } else {
                    this.startTypingAnimation();
                }
            }, 200);
        }
    }

    ngOnDestroy(): void {
        this.cancelActiveWork();
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }
        this.eventsService.off('changelang');
        this.eventsService.off('loadLang');
        this.subscriptions.unsubscribe();
    }

    private subscribeToLanguageEvents(): void {
        this.eventsService.on('changelang', (lang: string) => {
            this.lang = lang;
            this.updatePlaceholder();
        });
        this.eventsService.on('loadLang', (lang: string) => {
            this.lang = lang;
        });
        this.subscriptions.add(
            this.translate.onLangChange.subscribe(() => this.updatePlaceholder())
        );
    }

    private updatePlaceholder(): void {
        this.fullPlaceholderText = this.translate.instant('beta.placeholder');
        if (!this.medicalTextOriginal.trim()) {
            this.startTypingAnimation();
        }
    }

    private loadTimezone(): void {
        this.subscriptions.add(
            this.apiDx29ServerService.getInfoLocation().subscribe({
                next: (res: any) => {
                    this.timezone = res?.timezone || '';
                },
                error: err => this.insightsService.trackException(err)
            })
        );
    }

    lauchEvent(category: string): void {
        const elapsedSeconds = (Date.now() - this.startedAt) / 1000;
        this.analyticsService.trackEvent(category, {
            myuuid: this.myuuid,
            event_label: elapsedSeconds,
            elapsed_seconds: elapsedSeconds
        });
    }

    useExample(type: 'question'): void {
        this.medicalTextOriginal = this.translate.instant('beta.example_question_text');
        this.lauchEvent(`Beta - Use example (${type})`);
        this.focusTextArea();
        this.resizeTextArea();
    }

    async checkPopup(contentIntro: any): Promise<void> {
        if (this.callingAI || this.medicalTextOriginal.trim().length < 15) {
            let message = this.translate.instant('land.required');
            if (this.medicalTextOriginal.length > 0) {
                message += '<br><br>' + this.translate.instant('land.charactersleft', {
                    value: 15 - this.medicalTextOriginal.length
                });
            }
            message += '<br><br>' + this.translate.instant('land.recommended');
            this.showError(message);
            return;
        }

        const characters = this.countCharacters(this.medicalTextOriginal);
        if (characters > 400000) {
            await Swal.fire({
                title: this.translate.instant('generics.textTooLongMax'),
                text: this.translate.instant('generics.textTooLongMaxModel'),
                icon: 'info',
                confirmButtonText: 'Ok'
            });
            return;
        }

        if (characters > 8000) {
            this.insightsService.trackEvent(
                this.translate.instant('generics.excessCharacters', { excessCharacters: characters })
            );
            const result = await Swal.fire({
                title: this.translate.instant('generics.textTooLongMax'),
                html: this.translate.instant('generics.textTooLongMaxMessage')
                    + '<br><br>' + this.translate.instant('generics.recommendedLength')
                    + '<br><br>' + this.translate.instant('generics.aiSummaryWarning'),
                icon: 'info',
                showDenyButton: true,
                confirmButtonText: this.translate.instant('generics.ShortenWithAI'),
                denyButtonText: this.translate.instant('generics.Shorten'),
                allowOutsideClick: false
            });
            if (result.isConfirmed) {
                this.summarizeQuestion();
            } else if (result.isDenied) {
                this.scrollToInput();
            }
            return;
        }

        if (characters > 3000) {
            const result = await Swal.fire({
                title: this.translate.instant('generics.textTooLong'),
                html: this.translate.instant('generics.textTooLongOptions')
                    + '<br><br>' + this.translate.instant('generics.aiSummaryWarning'),
                icon: 'info',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: this.translate.instant('generics.Continue'),
                denyButtonText: this.translate.instant('generics.ShortenWithAI'),
                cancelButtonText: this.translate.instant('generics.Shorten'),
                allowOutsideClick: false
            });
            if (result.isDenied) {
                this.summarizeQuestion();
                return;
            }
            if (!result.isConfirmed) {
                this.scrollToInput();
                return;
            }
        }

        if (localStorage.getItem('hideQuestionsDisclaimer') === 'true') {
            this.submitMedicalQuestion();
        } else {
            this.showDisclaimer(contentIntro);
        }
    }

    changeTerm(event: any): void {
        localStorage.setItem('hideQuestionsDisclaimer', event.checked ? 'true' : 'false');
    }

    showOptions(): void {
        this.terms2 = !this.terms2;
        localStorage.setItem('hideQuestionsDisclaimer', this.terms2 ? 'true' : 'false');
    }

    dismissDisclaimer(): void {
        this.terms2 = false;
        localStorage.setItem('hideQuestionsDisclaimer', 'false');
        this.closeModal();
    }

    closePopup(): void {
        this.closeModal();
        this.submitMedicalQuestion();
    }

    private showDisclaimer(content: any): void {
        this.closeModal();
        const options: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'ModalClass-sm'
        };
        this.modalReference = this.modalService.open(content, options);
        setTimeout(() => {
            document.getElementById('topmodal')?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
    }

    private closeModal(): void {
        this.modalReference?.close();
        this.modalReference = undefined;
    }

    private async submitMedicalQuestion(): Promise<void> {
        this.submittedQuestion = this.medicalTextOriginal.trim();
        this.medicalTextEng = this.submittedQuestion;
        this.callingAI = true;
        this.lauchEvent('Medical question started');
        Swal.close();

        try {
            await this.connectWebSocket();
        } catch (error) {
            this.showError(this.translate.instant('generics.error try again'), error);
            return;
        }

        this.showLoadingDialog();

        const lang = this.isValidLanguage(this.lang) ? this.lang : 'en';
        const value = {
            // Every request is intentionally self-contained. Neither the previous
            // answer nor any earlier question is sent to the model.
            description: this.submittedQuestion,
            diseases_list: '',
            myuuid: this.myuuid,
            lang,
            timezone: this.timezone,
            model: this.model,
            iframeParams: this.filterIframeParams(this.iframeParams)
        };

        this.activeRequest = this.apiDx29ServerService.ask(value).subscribe({
            next: (res: any) => this.handleAskResponse(res),
            error: err => this.handleAiError(err)
        });
    }

    private showLoadingDialog(): void {
        const html = `
            <p>${this.translate.instant('land.swal')}</p>
            <p>${this.translate.instant('land.swal2')}</p>
            <p>${this.translate.instant('land.swal3')}</p>
            <div id="websocket-progress" class="dxgpt-progress">
                <div id="progress-message">${this.getProgressMessage('connection')}</div>
                <div class="dxgpt-progress__track">
                    <div id="progress-bar" class="dxgpt-progress__bar"></div>
                </div>
                <div class="dxgpt-progress__percentage">
                    <span id="progress-percentage">0%</span>
                </div>
            </div>`;

        Swal.fire({
            html,
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: this.translate.instant('generics.Cancel'),
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: { popup: 'dxgpt-modal-loading' }
        }).then(result => {
            if (result.dismiss === Swal.DismissReason.cancel) {
                this.cancelActiveWork();
                this.callingAI = false;
                this.lauchEvent('Medical question cancelled');
            }
        });
    }

    private handleAskResponse(res: any): void {
        if (res?.isQueued) {
            this.showQueueDialog(res.queueInfo);
            return;
        }
        if (res?.result === 'processing') {
            return;
        }

        switch (res?.result) {
            case 'success':
                this.processAiSuccess(res);
                break;
            case 'blocked':
                this.showError(this.translate.instant('land.errorLocation'));
                break;
            case 'unsupported_language':
                this.showError(this.translate.instant(
                    this.medicalTextEng.length > 100
                        ? 'generics.unsupported language'
                        : 'generics.minDescriptionLength'
                ));
                break;
            case 'translation error':
                this.showError(this.translate.instant('generics.Translation error'));
                break;
            case 'error ai':
                this.showError(this.translate.instant('generics.sorry cant anwser1'));
                break;
            case 'error max tokens':
                this.lauchEvent(`error max tokens: ${this.medicalTextOriginal.length}`);
                this.showError(this.translate.instant('generics.sorry cant anwser3'));
                break;
            case 'error':
                this.showError(
                    this.translate.instant('generics.error try again')
                    + '<br><br>'
                    + this.translate.instant('generics.error edit patient description')
                );
                break;
            default:
                this.showError(this.translate.instant('generics.error try again'));
        }
    }

    private processAiSuccess(response: any): void {
        this.finishActiveWork();
        const diagnoses = Array.isArray(response?.data) ? response.data : [];

        if (response?.suggestedPage === 'home' || diagnoses.length > 0) {
            this.showWrongPageRedirect();
            this.lauchEvent('Redirect to diagnosis');
            return;
        }

        if (response?.medicalAnswer) {
            this.showMedicalAnswer(response);
            this.lauchEvent('Medical answer displayed in popup');
            return;
        }

        this.showError(this.translate.instant('beta.only_medical_question'));
        this.lauchEvent('only_medical_question Modal');
    }

    private showMedicalAnswer(content: any): void {
        const modalRef = this.modalService.open(MedicalInfoModalComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
            scrollable: true,
            ariaLabelledBy: 'medical-answer-title',
            windowClass: 'medical-info-modal medical-info-modal--questions'
        });
        modalRef.componentInstance.content = content.medicalAnswer;
        modalRef.componentInstance.sonarData = content.sonarData;
        modalRef.componentInstance.title = this.submittedQuestion || content.question;
        modalRef.componentInstance.model = content.model || this.model;
        modalRef.componentInstance.selectedFiles = [];
        modalRef.componentInstance.detectedLang = content.detectedLang || this.lang;
        modalRef.componentInstance.showQuestionActions = true;

        modalRef.result.then(
            action => action === 'new'
                ? this.startNewQuestion()
                : this.editCurrentQuestion(),
            () => this.restoreQuestionInput()
        );
    }

    private editCurrentQuestion(): void {
        this.lauchEvent('Medical answer - Edit question');
        this.restoreQuestionInput();
    }

    private startNewQuestion(): void {
        this.medicalTextOriginal = '';
        this.medicalTextEng = '';
        this.submittedQuestion = '';
        this.lauchEvent('Medical answer - New question');
        this.restoreQuestionInput(true);
    }

    private restoreQuestionInput(restartPlaceholder = false): void {
        setTimeout(() => {
            this.resizeTextArea();
            this.scrollToInput();
            if (restartPlaceholder) {
                this.startTypingAnimation();
            }
        });
    }

    private showWrongPageRedirect(): void {
        const text = this.medicalTextOriginal;
        Swal.close();
        Swal.fire({
            icon: 'info',
            html: this.translate.instant('beta.redirect_to_diagnosis'),
            showCancelButton: true,
            confirmButtonText: this.translate.instant('beta.redirect_confirm'),
            cancelButtonText: this.translate.instant('generics.Cancel'),
            allowOutsideClick: false
        }).then(result => {
            if (result.isConfirmed) {
                if (isPlatformBrowser(this.platformId) && text) {
                    sessionStorage.setItem('dxgpt.pendingPageInput', text);
                }
                this.router.navigate(['/']);
            }
        });
    }

    private handleAiError(err: any): void {
        let message = '';
        if (err?.result === 'translation error' || err?.error?.message === 'Translation error') {
            message = this.translate.instant('generics.Translation error');
        } else if (err?.error?.error?.code === 'content_filter') {
            message = this.translate.instant('generics.sorry cant anwser1');
        } else if (err?.error?.code === 'string_above_max_length') {
            this.lauchEvent(`error max tokens: ${this.medicalTextOriginal.length}`);
            message = this.translate.instant('generics.sorry cant anwser3');
        } else if (err?.error?.message === 'Invalid request format or content') {
            message = this.translate.instant('generics.Invalid request format or content');
        }
        this.showError(message || this.translate.instant('generics.error try again'), err);
    }

    private showError(message: string, err: any = null): void {
        this.finishActiveWork();
        Swal.fire({
            icon: 'info',
            html: message,
            showCancelButton: false,
            showConfirmButton: true,
            allowOutsideClick: false
        });
        if (err) {
            this.insightsService.trackException(err);
        } else {
            this.insightsService.trackException(message);
        }
    }

    private summarizeQuestion(): void {
        Swal.fire({
            title: this.translate.instant('generics.Please wait'),
            html: this.translate.instant('generics.summarizingText'),
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false
        });

        const value = {
            description: this.medicalTextOriginal,
            myuuid: this.myuuid,
            lang: this.lang,
            timezone: this.timezone
        };
        this.activeRequest = this.apiDx29ServerService.summarizeText(value).subscribe({
            next: async (res: any) => {
                if (res?.result !== 'success' || !res?.data?.summary) {
                    this.showError(this.translate.instant('generics.error try again'), res);
                    return;
                }
                this.medicalTextOriginal = res.data.summary;
                this.medicalTextEng = res.data.summary;
                Swal.close();
                setTimeout(() => this.resizeTextArea());
                await Swal.fire({
                    icon: 'info',
                    title: this.translate.instant('generics.Please review the summary'),
                    showConfirmButton: true,
                    allowOutsideClick: true
                });
                this.scrollToInput();
            },
            error: err => this.showError(this.translate.instant('generics.error try again'), err)
        });
    }

    private async connectWebSocket(): Promise<void> {
        this.closeWebSocket();
        const response: any = await this.apiDx29ServerService
            .negotiatePubSub(this.myuuid)
            .toPromise();

        return new Promise((resolve, reject) => {
            const socket = new WebSocket(response.url);
            this.webSocket = socket;
            const timeout = setTimeout(() => {
                if (!this.isWebSocketConnected) {
                    socket.close();
                    reject(new Error('WebSocket connection timeout'));
                }
            }, 10000);

            socket.onopen = () => {
                clearTimeout(timeout);
                this.isWebSocketConnected = true;
                resolve();
            };
            socket.onmessage = event => this.handleWebSocketMessage(event);
            socket.onerror = error => {
                clearTimeout(timeout);
                this.isWebSocketConnected = false;
                reject(error);
            };
            socket.onclose = () => {
                clearTimeout(timeout);
                this.isWebSocketConnected = false;
            };
        });
    }

    private handleWebSocketMessage(event: MessageEvent): void {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'progress') {
                this.updateWebSocketProgress(message.percentage, message.message, message.step);
            } else if (message.type === 'result') {
                this.processAiSuccess(message.data);
            } else if (message.type === 'error') {
                this.showError(this.translate.instant('generics.error try again'), message.data);
            }
        } catch (error) {
            this.showError(this.translate.instant('generics.error try again'), error);
        }
    }

    private getProgressMessage(phase: string, fallback = ''): string {
        const keys: Record<string, string> = {
            connection: 'progress.connecting',
            extract_documents: 'progress.extract_documents',
            summarize_input: 'progress.summarize_input',
            translation: 'progress.translating',
            medical_question: 'progress.medical_question',
            ai_processing: 'progress.analyzing',
            ai_details: 'progress.getting_details',
            anonymization: 'progress.anonymizing',
            finalizing: 'progress.finalizing'
        };
        const translationKey = keys[phase];
        if (!translationKey) {
            return fallback || phase;
        }
        const translatedMessage = this.translate.instant(translationKey);
        return translatedMessage === translationKey
            ? fallback || phase
            : translatedMessage;
    }

    private updateWebSocketProgress(progress: number, message: string, phase?: string): void {
        const progressBar = document.getElementById('progress-bar');
        const progressMessage = document.getElementById('progress-message');
        const progressPercentage = document.getElementById('progress-percentage');
        const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));

        if (progressBar) {
            progressBar.style.width = `${safeProgress}%`;
        }
        if (progressMessage) {
            progressMessage.textContent = phase
                ? this.getProgressMessage(phase, message)
                : message;
        }
        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(safeProgress)}%`;
        }
    }

    private showQueueDialog(queueInfo: any): void {
        this.currentTicketId = queueInfo.ticketId;
        this.currentPosition = queueInfo.position;
        this.startCountdown(queueInfo.estimatedWaitTime);
        this.startQueueStatusCheck();

        Swal.fire({
            title: this.translate.instant('generics.High demand'),
            html: this.getQueueStatusHtml(),
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: this.translate.instant('generics.Cancel'),
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'queue-status-popup',
                cancelButton: 'queue-cancel-button'
            }
        }).then(result => {
            if (result.dismiss === Swal.DismissReason.cancel) {
                this.cancelActiveWork();
                this.callingAI = false;
            }
        });
    }

    private startQueueStatusCheck(): void {
        this.cancelQueueStatusCheck();
        this.checkQueueStatus();
    }

    private checkQueueStatus(): void {
        const ticketId = this.currentTicketId;
        if (!ticketId) {
            return;
        }
        this.subscriptions.add(
            this.apiDx29ServerService.getQueueStatus(ticketId, this.timezone).subscribe({
                next: (res: any) => {
                    if (this.currentTicketId !== ticketId) {
                        return;
                    }
                    if (res?.result === 'success' && res.status === 'completed') {
                        this.processAiSuccess(res.data);
                        return;
                    }
                    const isWaiting = (res?.result === 'success'
                        && ['processing', 'queued'].includes(res.status))
                        || (res?.result === 'queued' && res.status === 'processing');
                    if (!isWaiting) {
                        if (res?.result === 'error') {
                            this.showError(this.translate.instant('generics.error try again'), res);
                        }
                        return;
                    }
                    this.currentPosition = res.position;
                    if (res.estimatedWaitTime) {
                        this.startCountdown(res.estimatedWaitTime);
                    }
                    Swal.update({ html: this.getQueueStatusHtml() });
                    this.queueStatusTimeout = setTimeout(() => this.checkQueueStatus(), 10000);
                },
                error: err => {
                    this.cancelQueueStatusCheck();
                    this.insightsService.trackException(err);
                }
            })
        );
    }

    private startCountdown(estimatedWaitTime: number): void {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        this.queueStartedAt = Date.now();
        this.totalWaitTimeMs = Math.max(1, estimatedWaitTime) * 60 * 1000;
        this.countdownInterval = setInterval(() => {
            if (this.currentTicketId) {
                Swal.update({ html: this.getQueueStatusHtml() });
            }
        }, 1000);
    }

    private getQueueStatusHtml(): string {
        const total = this.totalWaitTimeMs || 1;
        const elapsed = Date.now() - (this.queueStartedAt || Date.now());
        const remaining = Math.max(0, total - elapsed);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        const progress = Math.min(100, (elapsed / total) * 100);

        return `
            <div class="queue-status-message">
                <p>${this.translate.instant('generics.Your request is in queue')}</p>
                <div class="queue-status-message__details">
                    <span>${this.translate.instant('generics.Position')}:</span>
                    <strong>#${this.currentPosition || '-'}</strong>
                    <span>${this.translate.instant('generics.Estimated wait time')}:</span>
                    <strong>${minutes}:${seconds.toString().padStart(2, '0')}</strong>
                </div>
                <div class="queue-status-message__track">
                    <div style="width:${progress}%"></div>
                </div>
                <small>${this.translate.instant('generics.Please keep this window open')}</small>
            </div>`;
    }

    private finishActiveWork(): void {
        this.callingAI = false;
        this.activeRequest?.unsubscribe();
        this.activeRequest = undefined;
        this.cancelQueueStatusCheck();
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = undefined;
        }
        this.currentTicketId = undefined;
        this.currentPosition = undefined;
        this.queueStartedAt = undefined;
        this.totalWaitTimeMs = undefined;
        this.closeWebSocket();
        Swal.close();
    }

    private cancelActiveWork(): void {
        this.activeRequest?.unsubscribe();
        this.activeRequest = undefined;
        this.finishActiveWork();
    }

    private cancelQueueStatusCheck(): void {
        if (this.queueStatusTimeout) {
            clearTimeout(this.queueStatusTimeout);
            this.queueStatusTimeout = undefined;
        }
    }

    private closeWebSocket(): void {
        this.webSocket?.close();
        this.webSocket = null;
        this.isWebSocketConnected = false;
    }

    private isValidLanguage(lang: string): boolean {
        return typeof lang === 'string'
            && lang !== 'undefined'
            && lang !== 'null'
            && lang.length >= 2;
    }

    private filterIframeParams(params: IframeParams): Partial<IframeParams> {
        if (!params) {
            return {};
        }
        const validFields: Array<keyof IframeParams> = [
            'centro',
            'ambito',
            'especialidad',
            'turno',
            'servicio',
            'id_paciente'
        ];
        return validFields.reduce((filtered, field) => {
            const value = params[field];
            if (value !== undefined && value !== null && value !== '') {
                (filtered as any)[field] = value;
            }
            return filtered;
        }, {} as Partial<IframeParams>);
    }

    private trackParametersReceived(params: IframeParams): void {
        try {
            this.analyticsService.trackIframeParameters({
                ...params,
                isInIframe: this.isInIframe
            });
            this.lauchEvent('Parameters received');
        } catch (error) {
            this.analyticsService.trackException(error);
        }
    }

    private consumePendingInput(): boolean {
        if (!isPlatformBrowser(this.platformId)) {
            return false;
        }
        const pending = sessionStorage.getItem('dxgpt.pendingPageInput');
        if (!pending) {
            return false;
        }
        sessionStorage.removeItem('dxgpt.pendingPageInput');
        this.medicalTextOriginal = pending;
        return true;
    }

    countCharacters(text: string): number {
        return text?.trim().length || 0;
    }

    resizeTextArea(): void {
        setTimeout(() => {
            const element = this.textArea?.nativeElement;
            if (!element) {
                return;
            }
            element.style.height = 'auto';
            const contentHeight = element.scrollHeight;
            element.style.height = `${Math.min(Math.max(contentHeight, 100), 500)}px`;
            element.style.overflowY = contentHeight > 500 ? 'auto' : 'hidden';
        });
    }

    startTypingAnimation(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }
        this.textareaPlaceholder = '';
        let currentIndex = 0;
        this.typingInterval = setInterval(() => {
            currentIndex = Math.min(currentIndex + 3, this.fullPlaceholderText.length);
            this.textareaPlaceholder = this.fullPlaceholderText.substring(0, currentIndex);
            if (currentIndex >= this.fullPlaceholderText.length && this.typingInterval) {
                clearInterval(this.typingInterval);
            }
        }, 40);
    }

    focusTextArea(): void {
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }
        this.textareaPlaceholder = '';
    }

    restorePlaceholder(): void {
        if (!this.medicalTextOriginal.trim()) {
            this.startTypingAnimation();
        }
    }

    getButtonTitle(): string {
        if (this.callingAI) {
            return this.translate.instant('generics.Please wait');
        }
        if (this.medicalTextOriginal.length < 15) {
            return this.translate.instant('beta.placeholder');
        }
        return this.translate.instant('beta.search');
    }

    private scrollToInput(): void {
        document.getElementById('initsteps')?.scrollIntoView({ behavior: 'smooth' });
        this.textArea?.nativeElement.focus();
    }
}
