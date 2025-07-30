import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ViewChildren, QueryList, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { EventsService } from 'app/shared/services/events.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { Clipboard } from "@angular/cdk/clipboard"
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { FeedbackPageComponent } from 'app/pages/land/feedback/feedback-page.component';
import { UuidService } from 'app/shared/services/uuid.service';
import { BrandingService } from 'app/shared/services/branding.service';
import { IframeParamsService, IframeParams } from 'app/shared/services/iframe-params.service';
import { MedicalInfoModalComponent } from './medical-info-modal.component';
declare let gtag: any;

@Component({
    selector: 'app-undiagnosed-page',
    templateUrl: './undiagnosed-page.component.html',
    styleUrls: ['./undiagnosed-page.component.scss'],
    providers: [ApiDx29ServerService],
})

export class UndiagnosedPageComponent implements OnInit, OnDestroy {

    private subscription: Subscription = new Subscription();
    medicalTextOriginal: string = '';
    editmedicalText: string = '';
    medicalTextEng: string = '';
    differentialTextOriginal: string = '';
    differentialTextTranslated: string = '';
    copyMedicalText: string = '';
    modalReference: NgbModalRef;
    topRelatedConditions: any = [];
    diseaseListEn: any = [];
    diseaseListText: string = '';
    lang: string = 'en';
    detectedLang: string = 'en';
    selectedInfoDiseaseIndex: number = -1;
    _startTime: any;
    myuuid: string;
    currentStep: number = 1;
    questions: any = [];
    answerAI: string = '';
    showErrorCall1: boolean = false;
    showErrorCall2: boolean = false;
    callingAI: boolean = false;
    loadingAnswerAI: boolean = false;
    selectedDisease: string = '';
    options: any = {};
    optionSelected: any = {};
    sendingVote: boolean = false;
    selectorOption: string = '';
    symtpmsLabel: string = '';
    sending: boolean = false;
    symptomsDifferencial: any = [];
    selectedQuestion: string = '';
    email: string = '';
    loadMoreDiseases: boolean = false;
    currentTicketId: string = '';
    showErrorForm: boolean = false;
    sponsors = [];

    hasAnonymize: boolean = false;
    callingAnonymize: boolean = false;
    tienePrisa: boolean = false;
    resultAnonymized: string = '';
    copyResultAnonymized: string = '';
    timezone: string = '';
    terms2: boolean = false;
    model: boolean = false;
    
    // Propiedad para manejar el placeholder
    textareaPlaceholder: string = '';
    private fullPlaceholderText: string = ''; // Almacena el texto completo del placeholder
    private typingInterval: any; // Para el intervalo de animación

    // Nuevas propiedades para la funcionalidad de preguntas de seguimiento
    showFollowUpQuestions: boolean = false;
    followUpQuestions: any[] = [];
    selectedFollowUpAnswer: string = '';
    followUpAnswers: any = {};
    loadingFollowUpQuestions: boolean = false;
    processingFollowUpAnswers: boolean = false;

    @ViewChildren('autoajustable') textAreas: QueryList<ElementRef>;
    @ViewChild('autoajustable', { static: false }) mainTextArea: ElementRef;
    @ViewChild('textareaedit') textareaEdit: ElementRef;

    private queueStatusTimeout: any;
    private readonly QUEUE_CHECK_INTERVAL = 1000; // 10 segundos

    // Variables para el contador
    private startTime: number;
    private totalWaitTime: number;
    private countdownInterval: any;

    private currentPosition: number = 0;

    modeFunctionality: boolean = false;
    private clickCounter: number = 0;
    private lastClickTime: number = 0;
    currentYear: number = new Date().getFullYear();
    generatingPDF: boolean = false;

    selectedFiles: File[] = [];
    summary: string = '';
    details: any = null;

    isDragOver = false;

    filesAnalyzed = false;
    filesModifiedAfterAnalysis = false; // Nueva propiedad para rastrear modificaciones

    // Propiedades para WebSocket/PubSub
    private webSocket: WebSocket | null = null;
    private isWebSocketConnected: boolean = false;

    // Propiedades para parámetros de iframe
    iframeParams: IframeParams = {};
    isInIframe: boolean = false;

    constructor(private http: HttpClient, public translate: TranslateService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private eventsService: EventsService, public insightsService: InsightsService, private renderer: Renderer2, private route: ActivatedRoute, private uuidService: UuidService, private brandingService: BrandingService, private iframeParamsService: IframeParamsService) {
        this.initialize();
    }

    private initialize() {
        this._startTime = Date.now();
        this.myuuid = this.uuidService.getUuid();
        this.lauchEvent("Init Page");
        this.currentStep = 1;
        this.loadSponsors();
        this.loadingIP();
        
        // Inicializar el placeholder con el idioma correcto
        this.fullPlaceholderText = this.translate.instant('land.Placeholder help');
    }

    private setLangFromSession(lang: string) {
        this.lang = lang;
    }

    loadingIP() {
        this.subscription.add(this.apiDx29ServerService.getInfoLocation()
            .subscribe((res: any) => {
                if (res.timezone) {
                    console.log(res.timezone);
                    this.timezone = res.timezone
                } else {
                    this.insightsService.trackException(res);
                }
            }, (err) => {
                console.log(err);
                this.insightsService.trackException(err);
            }));
    }

    loadSponsors() {
        this.subscription.add(this.http.get('assets/jsons/sponsors.json')
            .subscribe((res: any) => {
                this.sponsors = res;
            }, (err) => {
                this.insightsService.trackException(err);
                console.log(err);
            }));
    }

    async goPrevious() {
        this.model = false;
        this.topRelatedConditions = [];
        this.currentStep = 1;
        await this.delay(200);
        document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
        this.clearText();
        this.filesAnalyzed = false;
        this.filesModifiedAfterAnalysis = false;
        this.selectedFiles = [];
    }

    async newPatient() {
        this.medicalTextOriginal = '';
        this.goPrevious();
    }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        if (category == "Info Disease") {
            var subcate = 'Info Disease - ' + this.selectedDisease;
            gtag('event', subcate, { 'myuuid': this.myuuid, 'event_label': secs });
            subcate = 'Info quest - ' + this.selectedDisease + ' - ' + this.selectedQuestion
            gtag('event', subcate, { 'myuuid': this.myuuid, 'event_label': secs });

        }else{
            gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });

        }
    }

    ngOnInit() {
        this.loadTranslations();
        
        // Detectar si estamos en iframe
        this.isInIframe = this.iframeParamsService.getIsInIframe();
        
        // Capturar parámetros de todas las fuentes (URL directa, fragment, iframe, postMessage)
        this.iframeParamsService.params$.subscribe(params => {
            this.iframeParams = params;
            
            // Procesar texto médico pre-cargado (desde cualquier fuente: URL directa, iframe, postMessage)
            if (params.medicalText) {
                this.medicalTextOriginal = params.medicalText;
                setTimeout(() => {
                    const hiddenButton = document.getElementById('hiddenCheckPopupButton');
                    if (hiddenButton) {
                        (hiddenButton as HTMLElement).click();
                    }
                }, 500);
            }
            
            // Log de parámetros recibidos para debugging
            if (params.centro) {
                console.log('Centro hospitalario detectado:', params.centro);
            }
            
            if (params.ambito) {
                console.log('Ámbito detectado:', params.ambito);
            }
            
            if (params.especialidad) {
                console.log('Especialidad detectada:', params.especialidad);
            }
            
            // Enviar evento de analytics si hay parámetros
            if (Object.keys(params).length > 0) {
                this.trackParametersReceived(params);
            }
        });

        this.subscribeToEvents();
        
        // Forzar la actualización del placeholder con el idioma actual
        setTimeout(() => {
            this.fullPlaceholderText = this.translate.instant('land.Placeholder help');
            this.startTypingAnimation();
        }, 200);
    }

    loadTranslations() {
        this.translate.get('land.Symptoms').subscribe((res: string) => {
            this.symtpmsLabel = res;
        });
        
        this.questions = [
            { id: 1, question: 'land.q1' },
            { id: 2, question: 'land.q2' },
            { id: 3, question: 'land.q3' },
            { id: 4, question: 'land.q4' },
            { id: 5, question: 'land.q5' },
            { id: 6, question: 'land.q6' }
        ];
        this.options = { id: 1, value: this.translate.instant("land.option1"), label: this.translate.instant("land.labelopt1"), description: this.translate.instant("land.descriptionopt1") };
    }

    subscribeToEvents() {
        this.eventsService.on('changelang', async (lang) => {
            this.lang = lang;
            this.loadTranslations();
            if (this.currentStep == 2 && this.topRelatedConditions.length>0) {
                this.translate.onLangChange.pipe(first()).subscribe(() => {
                    console.log('lang: '+lang);
                    const config = this.brandingService.getBrandingConfig();
                    Swal.fire({
                        title: this.translate.instant("land.Language has changed"),
                        text: this.translate.instant("land.Do you want to start over"),
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonColor: config?.colors.primary || '#B30000',
                        cancelButtonColor: '#B0B6BB',
                        confirmButtonText: this.translate.instant("generics.Yes"),
                        cancelButtonText: this.translate.instant("generics.No"),
                        showLoaderOnConfirm: true,
                        allowOutsideClick: false,
                        reverseButtons: true
                    }).then((result) => {
                        if (result.value) {
                            this.restartInitVars();
                            this.currentStep = 1;
                            setTimeout(() => {
                                this.fullPlaceholderText = this.translate.instant('land.Placeholder help');
                                this.startTypingAnimation();
                            }, 200);
                        }
                    });
                });
                
            }
        });
        this.eventsService.on('backEvent', async (event) => {
            console.log(event);
            console.log(this.currentStep);
            console.log(this.topRelatedConditions.length);
            if (this.currentStep == 2 && this.topRelatedConditions.length>0) {
                //ask for confirmation
                const config = this.brandingService.getBrandingConfig();
                Swal.fire({
                    title: this.translate.instant("land.Do you want to start over"),
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: config?.colors.primary || '#B30000',
                    cancelButtonColor: '#B0B6BB',
                    confirmButtonText: this.translate.instant("generics.Yes"),
                    cancelButtonText: this.translate.instant("generics.No"),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: false,
                    reverseButtons: true
                }).then((result) => {
                    if (result.value) {
                        this.newPatient();
                    }
                });
            }else if(this.currentStep == 1 && this.selectedFiles.length > 0){
                const config = this.brandingService.getBrandingConfig();
                Swal.fire({
                    title: this.translate.instant("land.Do you want to start over"),
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: config?.colors.primary || '#B30000',
                    cancelButtonColor: '#B0B6BB',
                    confirmButtonText: this.translate.instant("generics.Yes"),
                    cancelButtonText: this.translate.instant("generics.No"),    
                    showLoaderOnConfirm: true,
                    allowOutsideClick: false,
                    reverseButtons: true
                }).then((result) => {
                    if (result.value) {
                        this.newPatient();
                    }
                });
            }
        });

        this.eventsService.on('loadLang', async (lang) => {
            this.setLangFromSession(lang);
        });
        
        // Suscribirse explícitamente a los cambios de idioma del servicio de traducción
        this.subscription.add(
            this.translate.onLangChange.subscribe((event) => {
                this.fullPlaceholderText = this.translate.instant('land.Placeholder help');
                if (!this.medicalTextOriginal || this.medicalTextOriginal.trim() === '') {
                    this.startTypingAnimation();
                }
            })
        );
    }

    delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    changeTerm($event) {
        if ($event.checked) {
            localStorage.setItem('hideIntroLogins', 'true')
        } else {
            localStorage.setItem('hideIntroLogins', 'false')
        }
    }

    showOptions() {
        this.terms2 = !this.terms2;
        if (this.terms2) {
            localStorage.setItem('hideIntroLogins', 'true')
        } else {
            localStorage.setItem('hideIntroLogins', 'false')
        }
    }

    showPanelIntro(content) {
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
        let ngbModalOptions: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'ModalClass-sm'
        };
        this.modalReference = this.modalService.open(content, ngbModalOptions);
    }

    ngOnDestroy() {
        this.cancelQueueStatusCheck();
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        // Limpiar el intervalo de typing
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }
        
        // Limpiar WebSocket
        if (this.webSocket) {
            this.webSocket.close();
            this.webSocket = null;
        }
        
        // Desuscribirse de los eventos
        this.eventsService.off('changelang');
        this.eventsService.off('backEvent');
        this.eventsService.off('loadLang');
        
        // Cancelar todas las suscripciones
        this.subscription.unsubscribe();
    }

    // Métodos para WebSocket/PubSub
    private async connectWebSocket(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                // Cerrar conexión existente si la hay
                if (this.webSocket) {
                    this.webSocket.close();
                    this.webSocket = null;
                }
    
                // Obtener token de conexión
                const response = await this.apiDx29ServerService.negotiatePubSub(this.myuuid).toPromise();
                const { url } = response as any;
    
                // Crear conexión WebSocket
                this.webSocket = new WebSocket(url);
    
                this.webSocket.onopen = () => {
                    console.log('WebSocket connected');
                    this.isWebSocketConnected = true;
                    resolve();
                };
    
                this.webSocket.onmessage = (event) => {
                    this.handleWebSocketMessage(event);
                };
    
                this.webSocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isWebSocketConnected = false;
                    reject(error);
                };
    
                this.webSocket.onclose = (event) => {
                    console.log('WebSocket disconnected', event.code, event.reason);
                    this.isWebSocketConnected = false;
                };
    
                // Timeout si no se conecta en 10 segundos (aumentado para Azure)
                setTimeout(() => {
                    if (!this.isWebSocketConnected) {
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000); // Azure Web PubSub puede tardar un poco más
    
            } catch (error) {
                reject(error);
            }
        });
    }

    private handleWebSocketMessage(event: MessageEvent) {
        try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'progress':
                    this.updateWebSocketProgress(message.percentage, message.message, message.step);
                    break;
                    
                case 'result':
                    // Resultado final recibido via WebSocket
                    Swal.close();
                    this.webSocket?.close();
                    this.webSocket = null;
                    this.processAiSuccess(message.data, null);
                    break;
                    
                case 'error':
                    // Error recibido via WebSocket
                    Swal.close();
                    this.webSocket?.close();
                    this.webSocket = null;
                    this.handleWebSocketError(message.data);
                    break;
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    private getProgressMessage(phase: string): string {
        const messages = {
            'connection': this.translate.instant('progress.connecting') || 'Connecting...',
            'translation': this.translate.instant('progress.translating') || 'Translating description...',
            'ai_processing': this.translate.instant('progress.analyzing') || 'Analyzing symptoms with AI...',
            'ai_details': this.translate.instant('progress.getting_details') || 'Getting diagnosis details...',
            'anonymization': this.translate.instant('progress.anonymizing') || 'Anonymizing personal information...',
            'finalizing': this.translate.instant('progress.finalizing') || 'Finalizing diagnosis...'
        };
        
        return messages[phase] || phase; // fallback al mensaje original
    }

    private updateWebSocketProgress(progress: number, message: string, phase?: string) {
        const displayMessage = phase ? this.getProgressMessage(phase) : message;
        
        const progressBar = document.getElementById('progress-bar');
        const progressMessage = document.getElementById('progress-message');
        const progressPercentage = document.getElementById('progress-percentage');
        
        if (progressBar) {
            progressBar.style.width = progress + '%';
            console.log(`Progress updated: ${progress}% - ${displayMessage}`);
        }
        if (progressMessage) {
            progressMessage.textContent = displayMessage;
        }
        if (progressPercentage) {
            progressPercentage.textContent = Math.round(progress) + '%';
        }
    }

    private handleWebSocketError(error: any) {
        console.error('WebSocket error:', error);
        let msgError = '';
        
        if (error.type === 'PROCESSING_ERROR') {
            msgError = this.translate.instant("generics.error try again");
        } else if (error.type === 'QUEUE_PROCESSING_ERROR') {
            msgError = this.translate.instant("generics.error try again");
        } else {
            msgError = this.translate.instant("generics.error try again");
        }
        
        this.showError(msgError, error);
        this.callingAI = false;
    }

    copyText(par) {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
        if (par == 'opt1') {
            this.medicalTextOriginal = this.translate.instant("land.p1.1")
        } else {
            this.medicalTextOriginal = this.translate.instant("land.p1.2")
        }
        document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
        this.resizeTextArea();
    }

    clearText() {
        this.differentialTextOriginal = '';
        this.differentialTextTranslated = '';
        this.copyMedicalText = '';
        this.showErrorCall1 = false;
        document.getElementById("textarea1").setAttribute("style", "height:50px;overflow-y:hidden; width: 100%;");
        this.resizeTextArea();
    }

    async checkPopup(contentIntro) {
        this.showErrorCall1 = false;
        if (this.callingAI || this.medicalTextOriginal.length < 15) {
            this.showErrorCall1 = true;
            let text = this.translate.instant("land.required");
            if (this.medicalTextOriginal.length > 0) {
                let introText = this.translate.instant("land.charactersleft", {
                    value: (15 - this.medicalTextOriginal.length)
                })
                text = text + '<br><br>' + introText;
            }
            let introText2 = this.translate.instant("land.recommended");
            text = text + '<br><br>' + introText2;
            this.showError(text, null);
            return;
        }
        let characters = this.countCharacters(this.medicalTextOriginal);
        if (characters > 400000) {
            Swal.fire({
              title: this.translate.instant("generics.textTooLongMax"),
              text: this.translate.instant("generics.textTooLongMaxModel"),
              icon: 'info',
              confirmButtonText: 'Ok'
            });
            return;
          }
        if(characters > 8000) {
            let errorMessage = this.translate.instant("generics.excessCharacters", {
                excessCharacters: characters
            });
            this.insightsService.trackEvent(errorMessage);
            Swal.fire({
                title: this.translate.instant("generics.textTooLongMax"),
                html: this.translate.instant("generics.textTooLongMaxMessage") + '<br><br>' + this.translate.instant("generics.recommendedLength") + '<br><br>' + this.translate.instant("generics.aiSummaryWarning"),
                icon: 'info',
                showDenyButton: true,
                confirmButtonText: this.translate.instant("generics.ShortenWithAI"),
                denyButtonText: this.translate.instant("generics.Shorten"),
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    this.callAIForSummary('new');
                } else if (result.isDenied) {
                    this.scrollTo();
                }
            });
            return;
        }

        if(characters > 3000) {
            Swal.fire({
                title: this.translate.instant("generics.textTooLong"),
                html: this.translate.instant("generics.textTooLongOptions") + '<br><br>' + this.translate.instant("generics.aiSummaryWarning"),
                icon: 'info',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: this.translate.instant("generics.Continue"),
                denyButtonText: this.translate.instant("generics.ShortenWithAI"),
                cancelButtonText: this.translate.instant("generics.Shorten"),
                allowOutsideClick: false
            }).then(async (result) => {
                if (result.isConfirmed) {
                    if (!this.showErrorCall1) {
                        if (localStorage.getItem('hideIntroLogins') == null || localStorage.getItem('hideIntroLogins') != 'true') {
                            this.showPanelIntro(contentIntro)
                            await this.delay(200);
                            document.getElementById('topmodal').scrollIntoView({ behavior: "smooth" });
                        } else {
                            this.preparingcallAI('step1');
                        }
                    }
                } else if (result.isDenied) {
                    this.callAIForSummary('new');
                } else if (result.isDismissed) {
                    this.scrollTo();
                }
            });
            return;
        }
        
        if (!this.showErrorCall1) {
            if (localStorage.getItem('hideIntroLogins') == null || localStorage.getItem('hideIntroLogins') != 'true') {
                this.showPanelIntro(contentIntro)
                await this.delay(200);
                document.getElementById('topmodal').scrollIntoView({ behavior: "smooth" });
            } else {
                this.preparingcallAI('step1');
            }
        }
    }

    closePopup() {
        this.preparingcallAI('step1');
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
    }

    preparingcallAI(step) {
        this.callingAI = true;
        if (step == 'step4') {
            const cleanDifferentialText = this.differentialTextOriginal.trim();
            const cleanTranslatedText = this.differentialTextTranslated.trim();
            
            // Función auxiliar para concatenar textos con el separador adecuado
            const concatenateText = (baseText: string, newText: string) => {
                const baseTextTrimmed = baseText.trim();
                const separator = baseTextTrimmed.endsWith('.') ? ' ' : 
                                baseTextTrimmed.endsWith(',') ? ' ' : 
                                this.medicalTextOriginal.includes(this.optionSelected.value) ? ', ' : '. ';
                return `${baseTextTrimmed}${separator}${newText}`;
            };
    
            this.copyMedicalText = concatenateText(this.copyMedicalText, cleanTranslatedText);
            this.medicalTextOriginal = concatenateText(this.medicalTextOriginal, cleanDifferentialText);
            this.medicalTextEng = this.copyMedicalText;
        } else {
            this.medicalTextEng = this.medicalTextOriginal;
        }
        
        this.differentialTextOriginal = '';
        this.differentialTextTranslated = '';
        this.continuePreparingcallAI(step);
    }


    continuePreparingcallAI(step) {
        if (step == 'step4') {
            this.callAI(false);
        } else {
            Swal.fire({
                title: this.translate.instant("generics.Please wait"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {

            });
            this.callAI(false);
        }

    }

    // Función para filtrar parámetros del objeto iframeParams - solo permite campos válidos
    private filterIframeParams(params: any): any {
        if (!params) return {};
        
        // Solo permitir estos campos específicos
        const validFields = ['centro', 'ambito', 'especialidad', 'turno', 'servicio', 'id_paciente'];
        
        const filteredParams: any = {};
        
        // Solo incluir campos válidos
        validFields.forEach(field => {
            if (params[field] !== undefined && params[field] !== null && params[field] !== '') {
                filteredParams[field] = params[field];
            }
        });
        
        return filteredParams;
    }

    async callAI(newModel: boolean) {
        Swal.close();
        
        // Determinar el modelo a usar
        let modelToUse = 'gpt4o';
        if (newModel) {
            modelToUse = 'o3';
        }
        
        // Para modelos largos, conectar WebSocket primero
        const isLongModel = (modelToUse === 'o3');
        console.log(`Model: ${modelToUse}, isLongModel: ${isLongModel}`);
        if (isLongModel) {
            try {
                await this.connectWebSocket();
            } catch (error) {
                console.error('Error connecting WebSocket:', error);
                this.showError(this.translate.instant("generics.error try again"), error);
                return;
            }
        }

        const htmlContent = '<p>' + this.translate.instant("land.swal") + '</p>' + 
          '<p>' + this.translate.instant("land.swal2") + '</p>' + 
          '<p>' + this.translate.instant("land.swal3") + '</p>' + 
          (isLongModel ?
            `<div id="websocket-progress" style="margin: 18px 0 10px 0; padding: 12px 18px; background: rgba(30,34,40,0.95); border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.18); border: 1px solid #23272f;">
              <div id="progress-message" style="margin-bottom: 8px; font-weight: 500; color: #e0e0e0; font-size: 15px; letter-spacing: 0.01em; font-family: 'Inter', 'Segoe UI', Arial, sans-serif;">${this.getProgressMessage('ai_processing')}</div>
              <div style="width: 100%; height: 18px; background: #23272f; border-radius: 9px; overflow: hidden; border: 1px solid #353b45;">
                <div id="progress-bar" style="width: 5%; height: 100%; background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%); transition: width 0.5s cubic-bezier(.4,2.3,.3,1); border-radius: 9px; min-width: 10px; box-shadow: 0 1px 6px #43e97b44;"></div>
              </div>
              <div style="margin-top: 6px; font-size: 12px; color: #b0b6bb; text-align: right; font-family: 'Inter', 'Segoe UI', Arial, sans-serif;">
                <span id="progress-percentage">5%</span>
              </div>
            </div>` :
            '<p><em class="white fa fa-spinner fa-3x fa-spin fa-fw"></em></p>');

        Swal.fire({
            html: htmlContent,
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: this.translate.instant("generics.Cancel"),
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'dxgpt-modal-loading'
            }
        }).then(function (event) {
            if (event.dismiss == Swal.DismissReason.cancel) {
                this.callingAI = false;
                this.subscription.unsubscribe();
                this.subscription = new Subscription();
                if (this.webSocket) {
                    this.webSocket.close();
                    this.webSocket = null;
                }
            }
        }.bind(this));

        // Inicializar progreso para modelos largos
        if (isLongModel) {
            setTimeout(() => {
                this.updateWebSocketProgress(10, 'Conectando...', 'connection');
            }, 100);
        }

        this.callingAI = true;
        var value = { 
            description: this.medicalTextEng, 
            diseases_list: '', 
            myuuid: this.myuuid, 
            lang: this.lang, 
            timezone: this.timezone, 
            model: modelToUse,
            // Filtrar parámetros - solo permite campos válidos
            iframeParams: this.filterIframeParams(this.iframeParams)
        };
        
        if (this.loadMoreDiseases) {
            value.diseases_list = this.diseaseListText;
        }

        this.apiDx29ServerService.diagnose(value).subscribe(
            (res: any) => this.handledDiagnoseResponse(res, value),
            (err: any) => this.handleAiError(err)
        );
    }

    callAdvancedModel(){
        this.lauchEvent('callAdvancedModel' );
        this.callingAI = true;
        this.medicalTextEng = this.medicalTextOriginal;
        this.differentialTextOriginal = '';
        this.differentialTextTranslated = '';
        this.callAI(true);
    }

    callFastModel(){
        this.lauchEvent('callFastModel');
        this.callingAI = true;
        this.medicalTextEng = this.medicalTextOriginal;
        this.differentialTextOriginal = '';
        this.differentialTextTranslated = '';
        this.callAI(false);
    }

    handledDiagnoseResponse(res: any, value: any) {
       
        let msgError = this.translate.instant("generics.error try again");
        
        // Si la respuesta está en cola
        if (res.isQueued) {
            const queueInfo = res.queueInfo;
            this.currentTicketId = queueInfo.ticketId;
            this.currentPosition = queueInfo.position;
            
            // Iniciar el intervalo de consulta y el contador
            this.startQueueStatusCheck();
            this.startCountdown(queueInfo.estimatedWaitTime);
            
            // Obtener todas las traducciones necesarias
            const translations = {
                title: this.translate.instant("generics.High demand"),
                inQueue: this.translate.instant("generics.Your request is in queue"),
                position: this.translate.instant("generics.Position"),
                estimatedTime: this.translate.instant("generics.Estimated wait time"),
                minutes: this.translate.instant("generics.minutes"),
                seconds: this.translate.instant("generics.seconds"),
                keepOpen: this.translate.instant("generics.Please keep this window open"),
                cancel: this.translate.instant("generics.Cancel")
            };
            
            Swal.fire({
                title: translations.title,
                html: `
                    <div class="queue-status-message" style="text-align: center; margin: 20px 0;">
                        <p style="color: #666; margin: 10px 0;">${translations.inQueue}</p>
                        <div style="background: #f3f3f3; border-radius: 10px; padding: 15px; margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span style="color: #666;">${translations.position}:</span>
                                <span style="font-weight: bold; color: #333;">#${this.currentPosition}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #666;">${translations.estimatedTime}:</span>
                                <span style="font-weight: bold; color: #333;">${queueInfo.estimatedWaitTime}:00</span>
                            </div>
                        </div>
                        <div style="background: #e8e8e8; height: 8px; border-radius: 4px; margin: 20px 0;">
                            <div style="background: #4CAF50; width: 0%; height: 100%; border-radius: 4px; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: center; margin-top: 15px;">
                            <div class="queue-spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite;"></div>
                            <span style="color: #666; margin-left: 10px;">${translations.keepOpen}</span>
                        </div>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `,
                showCancelButton: true,
                showConfirmButton: false,
                cancelButtonText: translations.cancel,
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: {
                    popup: 'queue-status-popup',
                    cancelButton: 'queue-cancel-button'
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.cancel) {
                    this.cancelQueueStatusCheck();
                    if (this.countdownInterval) {
                        clearInterval(this.countdownInterval);
                    }
                    this.callingAI = false;
                    this.subscription.unsubscribe();
                    this.subscription = new Subscription();
                }
            });
            return;
        }

        // Si está procesando via WebSocket (modelos largos)
        if (res.result === 'processing') {
            // No hacer nada - el resultado llegará via WebSocket
            console.log('Processing via WebSocket. Waiting for results...');
            return;
        }

        if (res.result) {
            switch (res.result) {
                case 'blocked':
                    msgError = this.translate.instant("land.errorLocation");
                    this.showError(msgError, null);
                    this.callingAI = false;
                    break;
                case 'error':
                    msgError = this.translate.instant("generics.error try again");
                    msgError = msgError + '<br><br>' + this.translate.instant("generics.error edit patient description");
                    this.showError(msgError, null);
                    this.callingAI = false;
                    break;
                case 'unsupported_language':
                    if(this.medicalTextEng.length > 100){
                        msgError = this.translate.instant("generics.unsupported language");
                    }else{
                        msgError = this.translate.instant("generics.minDescriptionLength");
                    }
                    
                    this.showError(msgError, null);
                    this.callingAI = false;
                    break;
                case 'translation error':
                    msgError = this.translate.instant("generics.Translation error");
                    this.showError(msgError, null);
                    this.callingAI = false;
                    break;
                case 'error ai':
                    msgError = this.translate.instant("generics.sorry cant anwser1");
                    this.showError(msgError, null);
                    this.callingAI = false;
                    break;
                case 'error max tokens':
                    this.lauchEvent("error max tokens: "+this.medicalTextOriginal.length);
                    msgError = this.translate.instant("generics.sorry cant anwser3");
                    this.showError(msgError, null);
                    this.callingAI = false;
                    break;
                case 'success':
                    this.processAiSuccess(res, value);
                    break;
                default:
                    this.showError(this.translate.instant("generics.error try again"), null);
                    this.callingAI = false;
            }
        } else {
            msgError = this.translate.instant("generics.error try again");
            this.showError(msgError, null);
            this.callingAI = false;
        }
    }

    handleAiError(err: any) {
        console.log(err);
        
        let msgError = '';
        
        // Si el error es un objeto con la propiedad result
        if (err.result === 'translation error') {
            msgError = this.translate.instant('generics.Translation error');
        }
        // Si el error tiene la estructura error.error
        else if (err.error) {
            if (err.error.error && err.error.error.code === 'content_filter') {
                msgError = this.translate.instant('generics.sorry cant anwser1');
            } else if (err.error.type === 'invalid_request_error') {
                if (err.error.code === 'string_above_max_length') {
                    this.lauchEvent('error max tokens: '+this.medicalTextOriginal.length);
                    msgError = this.translate.instant('generics.sorry cant anwser3');
                } else {
                    msgError = err.error.code + ': ' + err.error.message;
                }
            } else if (err.error.message) {
                switch(err.error.message) {
                    case 'Invalid request format or content':
                        msgError = this.translate.instant('generics.Invalid request format or content');
                        break;
                    case 'Translation error':
                        msgError = this.translate.instant('generics.Translation error');
                        break;
                    default:
                        msgError = this.translate.instant('generics.error try again');
                }
            }
        }
        
        // Si no se ha establecido ningún mensaje de error específico
        if (!msgError) {
            msgError = this.translate.instant('generics.error try again');
        }
    
        this.showError(msgError, err);
        this.callingAI = false;
    }

    showError(message: string, err: any) {
        Swal.close();
        Swal.fire({
            icon: 'info',
            html: message,
            showCancelButton: false,
            showConfirmButton: true,
            allowOutsideClick: false
        });
        this.callingAI = false;
        if(err!=null){
            this.insightsService.trackException(err);
        }else{
            this.insightsService.trackException(message);
        }
    }

    showSuccess(message: string) {
        Swal.fire({
            icon: 'success',
            html: message,
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        })
        setTimeout(function () {
            Swal.close();
        }, 2000);
    }

    processAiSuccess(data: any, value: any) {
        if(data.model && data.model != 'gpt4o'){
            this.model = true;
        }else{
            this.model = false;
        }
        //if (this.currentStep == 1) {
        console.log(this.model);
        console.log(data);
        this.cancelQueueStatusCheck();
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        this.currentTicketId = null;
        this.currentPosition = null;
        this.totalWaitTime = null;
        this.startTime = null;
        if(data.data){
            if(data.data.length > 0){
                this.copyMedicalText = this.medicalTextEng;
                this.dataAnonymize(data.anonymization);//parseChoices0
                this.detectedLang = data.detectedLang;
                let parseChoices0 = data.data;
                if (!this.loadMoreDiseases) {
                    this.diseaseListEn = [];
                }
                this.setDiseaseListEn(parseChoices0);
                this.continuecallAI(parseChoices0);
            }else{
                if(data.medicalAnswer){
                    this.callingAI = false;
                    this.showMedicalInfoModal(data);
                }else{
                    this.showError(this.translate.instant("undiagnosed.only_patient_description"), null);
                    this.callingAI = false;
                }
            }
        }
    }

    showMedicalInfoModal(content: any) {
        Swal.close();
        const modalRef = this.modalService.open(MedicalInfoModalComponent, {
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            centered: true,
            windowClass: 'medical-info-modal'
        });
        modalRef.componentInstance.content = content.medicalAnswer;
        modalRef.componentInstance.disclaimerText = content.disclaimer.text;
        modalRef.componentInstance.resourcesText = content.resources.text;

        modalRef.componentInstance.title = content.question;
    }

    includesElement(array, string) {
        const lowerCaseString = string.toLowerCase();
        return array.some(element => lowerCaseString.includes(element.toLowerCase()));
    }

    createTranslationRequests(diseases) {
        let requests = [];
        diseases.forEach(disease => {
            requests.push({ "Text": disease.diagnosis });
            requests.push({ "Text": disease.description });
            requests.push({ "Text": disease.symptoms_in_common.join('; ') });
            requests.push({ "Text": disease.symptoms_not_in_common.join('; ') });
        });
        return requests;
    }

    async continuecallAI(parseChoices0) {
        let parseChoices = parseChoices0;
        if (!this.loadMoreDiseases) {
            this.topRelatedConditions = [];
        }

        const indexDisease = this.topRelatedConditions.length;
        parseChoices.forEach((disease, i) => {
            const sponsor = this.sponsors.find(s => this.includesElement(s.synonyms, disease.diagnosis));
            const matchingSymptoms = disease.symptoms_in_common.length > 0 ? disease.symptoms_in_common.join(', ') : this.translate.instant("diagnosis.None");
            const nonMatchingSymptoms = disease.symptoms_not_in_common.length > 0 ? disease.symptoms_not_in_common.join(', ') : this.translate.instant("diagnosis.None");
            const content = `
                <strong>${indexDisease + i + 1}. ${disease.diagnosis}:</strong> ${disease.description}
                <br> <em class="fa fa-check success me-1"></em>${this.translate.instant("diagnosis.Matching symptoms")}: ${matchingSymptoms}
                <br> <em class="fa fa-times danger me-1"></em>${this.translate.instant("diagnosis.Non-matching symptoms")}: ${nonMatchingSymptoms}
            `;
            this.topRelatedConditions.push({ content, name: disease.diagnosis, url: sponsor?.url || '', description: disease.description, matchingSymptoms: matchingSymptoms, nonMatchingSymptoms: nonMatchingSymptoms });
        });

        this.loadMoreDiseases = false;
        if (this.currentStep == 1) {
            this.currentStep = 2;
            history.pushState({ step: 2 }, 'DxGPT');
        }
        this.callingAI = false;
        Swal.close();
        //window.scrollTo(0, 0);
         // Nueva conversión para la cuenta de display
        gtag('event', 'conversion', {
            'send_to': 'AW-16829919003/877dCLbc_IwaEJvekNk-'
        });
        this.lauchEvent("Search Disease");
        if(this.iframeParams){
            if(this.iframeParams.centro){
                this.lauchEvent("Search centro: " + this.iframeParams.centro);
            }
            if(this.iframeParams.ambito){
                this.lauchEvent("Search ambito: " + this.iframeParams.ambito);
            }
            if(this.iframeParams.especialidad){
                this.lauchEvent("Search especialidad: " + this.iframeParams.especialidad);
            }
            this.lauchEvent("Search medicalText: " + this.iframeParams.medicalText);
        }
        if(this.selectedFiles.length > 0){
            this.lauchEvent("Multimodal" + this.selectedFiles.length);
        }
        await this.delay(200);
        this.scrollTo();
    }

    setDiseaseListEn(text) {
        text.forEach(item => {
            if (item.diagnosis && item.diagnosis.length > 3) {
                this.diseaseListEn.push(item.diagnosis);
            }
        });
    }

    loadMore() {
        var diseases = this.diseaseListEn.map(disease => '+' + disease).join(', ');
        this.diseaseListText = diseases;
        this.loadMoreDiseases = true;
        this.callAI(this.model);
    }

    async scrollTo() {
        await this.delay(400);
        document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
    }

    cancelCallQuestion() {
        this.symptomsDifferencial = [];
        this.answerAI = '';
        this.loadingAnswerAI = false;
        this.selectedQuestion = '';
        this.subscription.unsubscribe();
        this.subscription = new Subscription();
    }


    private getInfoOptionEvent(index: number): string {
        const events = [
            'Common Symptoms',
            'Detailed Information',
            'Diagnosis Test',
            'Differential Diagnosis',
            'Why Diagnosis'
        ];
        return events[index] || '';
    }

    showQuestion(question, index) {
        this.symptomsDifferencial = [];
        this.answerAI = '';
        this.loadingAnswerAI = true;
        this.selectedQuestion = question.question;
        var selectedDiseaseEn = this.diseaseListEn[this.selectedInfoDiseaseIndex];
        let index2 = selectedDiseaseEn.indexOf('.');
        if (index2 != -1) {
            var temp = selectedDiseaseEn.split(".");
            selectedDiseaseEn = temp[1];
        }

        let infoOptionEvent = this.getInfoOptionEvent(index);
        if(this.iframeParams){
            if(this.iframeParams.centro){
                infoOptionEvent += " centro: " + this.iframeParams.centro;
            }
            if(this.iframeParams.ambito){
                infoOptionEvent += " ambito: " + this.iframeParams.ambito;
            }
            if(this.iframeParams.especialidad){
                infoOptionEvent += " especialidad: " + this.iframeParams.especialidad;
            }
            if(this.iframeParams.medicalText){
                infoOptionEvent += " medicalText: " + this.iframeParams.medicalText;
            }
        }
        this.lauchEvent(infoOptionEvent);

        var value = { questionType: index, disease: selectedDiseaseEn, medicalDescription: this.medicalTextEng,myuuid: this.myuuid, timezone: this.timezone, detectedLang: this.detectedLang }
        this.subscription.add(this.apiDx29ServerService.callInfoDisease(value)
            .subscribe((res: any) => {
                if (res.result === 'success') {
                    if (res.data.type === 'differential') {
                      this.symptomsDifferencial = res.data.symptoms;
                    } else {
                      this.answerAI = res.data.content;
                    }
                    this.loadingAnswerAI = false;
                    this.lauchEvent("Info Disease");
                    if(this.iframeParams){
                        if(this.iframeParams.centro){
                            this.lauchEvent("Info centro: " + this.iframeParams.centro);
                        }
                        if(this.iframeParams.ambito){
                            this.lauchEvent("Info ambito: " + this.iframeParams.ambito);
                        }
                        if(this.iframeParams.especialidad){
                            this.lauchEvent("Info especialidad: " + this.iframeParams.especialidad);
                        }
                        if(this.iframeParams.medicalText){
                            this.lauchEvent("Info medicalText: " + this.iframeParams.medicalText);
                        }
                    }
                  } else {
                    // Manejar errores según el tipo
                    let msgError = this.translate.instant(
                      res.result === 'blocked' ? "land.errorLocation" :
                      res.result === 'error ai' ? "generics.sorry cant anwser1" :
                      "generics.error try again"
                    );
                    this.showError(msgError, null);
                    this.loadingAnswerAI = false;
                }

            }, (err) => {
                console.log(err);
                let msgError = '';
                if(err && err.error && err.error.message){
                    switch(err.error.message) {
                        case 'Invalid question type':
                            msgError = this.translate.instant("generics.errorQuestionType");
                            break;
                        case 'Invalid request format or content':
                            msgError = this.translate.instant("generics.Invalid request format or content");
                            break;
                        default:
                            msgError = this.translate.instant("generics.error try again");
                    }
                }else{
                    msgError = this.translate.instant("generics.error try again");
                }
                this.showError(msgError, err);
                this.loadingAnswerAI = false;
            }));

    }

    recalculateDifferencial() {
        var newSymptoms = this.symptomsDifferencial
          .filter(symptom => symptom.checked)
          .map(symptom => symptom.name)
          .join(', ');
          newSymptoms = newSymptoms.trim().replace(/(,| )+$/, '');
        if (newSymptoms !== '') {
          this.lauchEvent("Recalculate Differencial");
          this.optionSelected = this.options;
          this.closeDiseaseUndiagnosed();
          this.differentialTextOriginal = newSymptoms;
          this.verifCallDifferential();
        } else {
          this.showError(this.translate.instant("land.Select at least one symptom"), null);
        }
      }

    verifCallDifferential() {
        this.showErrorCall2 = false;
        if (this.callingAI || this.differentialTextOriginal.length == 0) {
            this.showErrorCall2 = true;
            let msgError = this.translate.instant("land.required");
            this.showError(msgError, null);
        }
        if (!this.showErrorCall2) {
            this.callAIDifferential();
        }
    }

    callAIDifferential() {
        if (this.differentialTextOriginal.length > 0) {
            Swal.fire({
                title: this.translate.instant("generics.Please wait"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {

            });
            this.differentialTextTranslated = this.differentialTextOriginal;
            
        }
        this.preparingcallAI('step4'); 
    }

    closeDiseaseUndiagnosed() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
    }

    restartInitVars() {
        this.medicalTextOriginal = '';
        this.copyMedicalText = '';
        this.topRelatedConditions = [];
    }

    showMoreInfoDiseasePopup(diseaseIndex, contentInfoDisease) {
        this.answerAI = '';
        this.symptomsDifferencial = [];
        this.selectedInfoDiseaseIndex = diseaseIndex;
        var nameEvent = 'Undiagnosed - Select Disease - ' + this.topRelatedConditions[this.selectedInfoDiseaseIndex].name;
        this.lauchEvent(nameEvent);
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
        this.modalReference = this.modalService.open(contentInfoDisease, ngbModalOptions);
        this.selectedDisease = this.topRelatedConditions[this.selectedInfoDiseaseIndex].name;
    }

    copyResults() {
        var finalReport = "";
        var infoDiseases = this.getPlainInfoDiseases2();
        if (infoDiseases != "") {
            // Dividir los diagnósticos en una lista y formatearlos
            const formattedDiseases = infoDiseases.split('\n').map(disease => `- ${disease}`).join('\n');
            finalReport = this.translate.instant("diagnosis.Proposed diagnoses") + ":\n" + formattedDiseases;
        }
        this.clipboard.copy(finalReport);
        let msgSuccess = this.translate.instant("land.Results copied to the clipboard");
        this.showSuccess(msgSuccess);
        this.lauchEvent("Copy results");
    }

    // Nueva funcionalidad para crear permalink
    creatingPermalink: boolean = false;

    async createPermalink() {
        if (this.topRelatedConditions.length === 0) {
            return;
        }

        try {
            this.creatingPermalink = true;
            
            // Crear objeto con todos los datos necesarios
            const permalinkData = {
                medicalDescription: this.medicalTextOriginal,
                anonymizedDescription: this.resultAnonymized || this.medicalTextOriginal,
                diagnoses: this.topRelatedConditions.slice(0, 10), // Limitar a top 10
                lang: this.lang,
                createdDate: new Date().toISOString(),
                myuuid: this.myuuid
            };

            // Llama al backend para crear el permalink
            this.apiDx29ServerService.createPermalink(permalinkData).subscribe(
                (res: any) => {
                    const permalinkId = res.permalinkId || res.id; // según tu backend
                    const permalinkUrl = `${window.location.origin}/result/${permalinkId}`;
                    this.clipboard.copy(permalinkUrl);
                    let msgSuccess = this.translate.instant("permalink.Permalink created and copied");
                    this.showSuccess(msgSuccess);
                    this.lauchEvent("Create permalink");
                    this.creatingPermalink = false;
                },
                (error) => {
                    this.handlePermalinkError();
                    this.creatingPermalink = false;
                }
            );
        } catch (error) {
            this.handlePermalinkError();
            this.creatingPermalink = false;
        }
    }

    private handlePermalinkError() {
        let msgError = this.translate.instant("permalink.Error creating permalink");
        this.showError(msgError, null);
        console.error('Error creating permalink');
    }

    /**
     * Envía eventos de analytics cuando se reciben parámetros
     */
    private trackParametersReceived(params: IframeParams): void {
        try {
            // Logs internos (opcional)
            this.lauchEvent("Parameters received");
            if (params.centro) this.lauchEvent("Center: " + params.centro);
            if (params.ambito) this.lauchEvent("Ambito: " + params.ambito);
            if (params.especialidad) this.lauchEvent("Esp.: " + params.especialidad);
            if (params.ambito || params.especialidad || params.centro) {
                const medicalData = {
                    ambito: params.ambito || '',
                    especialidad: params.especialidad || '',
                    centro: params.centro || ''
                };
                this.lauchEvent("All par: " + JSON.stringify(medicalData));
            }
    
            // Evento para Google Analytics 4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'iframe_parameters_received', {
                    'event_category': 'Iframe',
                    'event_label': 'Parámetros recibidos',
                    'centro': params.centro || '',
                    'ambito': params.ambito || '',
                    'especialidad': params.especialidad || ''
                });
            }
    
            if (this.isInIframe) this.lauchEvent("Iframe execution");
        } catch (error) {
            console.error('Error tracking parameters:', error);
        }
    }

    getPlainInfoDiseases2() {
        return this.topRelatedConditions.map(condition => condition.name).join("\n");
      }

      async downloadResults() {
        if (!this.callingAnonymize) {
          try {
            this.generatingPDF = true;
            const pdfMakeModule = await import('pdfmake/build/pdfmake');
            const vfsFontsModule = await import('pdfmake/build/vfs_fonts');
      
            // Extraer los módulos correctamente
            const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
            const vfsFonts = (vfsFontsModule as any).default || vfsFontsModule;
      
            // Asignar VFS correctamente
            pdfMake.vfs = vfsFonts.vfs;
      
            const { PdfMakeService } = await import('app/shared/services/pdf-make.service');
            const pdfService = new PdfMakeService(this.translate);
      
            await pdfService.generateResultsPDF(
              this.medicalTextOriginal,
              this.topRelatedConditions,
              this.lang,
              pdfMake
            );
            this.generatingPDF = false;
            this.lauchEvent('Download results');
      
          } catch (error) {
            this.generatingPDF = false;
            console.error('Error loading PDF service:', error);
            this.insightsService.trackException(error);
          }
        }
      }

    getLiteral(literal) {
        return this.translate.instant(literal);
    }

    vote(valueVote) {
        this.sendingVote = true;

        var value = { value: this.symtpmsLabel + " " + this.medicalTextOriginal + " Call Text: " + this.medicalTextEng, myuuid: this.myuuid, lang: this.lang, vote: valueVote, topRelatedConditions: this.topRelatedConditions, isNewModel: this.model }
        this.subscription.add(this.apiDx29ServerService.opinion(value)
            .subscribe((res: any) => {
                this.lauchEvent("Vote: " + valueVote);
                this.sendingVote = false;
                // Abrir el modal de FeedbackPageComponent
                if (localStorage.getItem('showFeedbackDxGPT') == null || localStorage.getItem('showFeedbackDxGPT') != 'true') {
                    let ngbModalOptions: NgbModalOptions = {
                        backdrop: 'static',
                        keyboard: false,
                        windowClass: 'ModalClass-lg'// xl, lg, sm
                    };
                    this.modalReference = this.modalService.open(FeedbackPageComponent, ngbModalOptions);
                }else{
                    let msgSuccess = this.translate.instant("land.thanks");
                    this.showSuccess(msgSuccess);
                }

            }, (err) => {
                if (err.error.message === 'Invalid request format or content') {
                    const msgError = this.translate.instant("generics.Invalid request format or content");
                    this.showError(msgError, err.error);
                } else {
                    const msgError = this.translate.instant("generics.error try again");
                    this.showError(msgError, err.error);
                }
                this.insightsService.trackException(err);
                console.log(err);
                this.sendingVote = false;
            }));
    }

    countCharacters(text) {
        text = text.trim();
        if (text === '') {
          return 0;
        }
        return text.length;
      }

    resizeTextArea() {
        if (this.textAreas) {
            this.textAreas.forEach(textArea => {
                const element = textArea.nativeElement;
                const maxHeight = 500; // altura máxima en píxeles
                
                // Reset height before recalculating
                element.style.height = 'auto';
                // Set new height
                const newHeight = element.scrollHeight;
                // Ensure height is between min and max values
                const finalHeight = Math.min(Math.max(newHeight, 100), maxHeight);
                element.style.height = finalHeight + 'px';
                
                // Add scrolling if content exceeds max height
                element.style.overflowY = newHeight > maxHeight ? 'auto' : 'hidden';
            });
        }
    }

    autoResize(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }

    private resizeTextAreaFunc(elements: QueryList<ElementRef>) {
        elements.forEach((element: ElementRef) => {
            const nativeElement = element.nativeElement;
            this.renderer.listen(nativeElement, 'input', () => {
                let height = nativeElement.scrollHeight;
                if (height < 50) height = 50;
                this.renderer.setStyle(nativeElement, 'height', `auto`);
                this.renderer.setStyle(nativeElement, 'height', `${height}px`);
            });
            let height = nativeElement.scrollHeight;
            if (height < 50) height = 50;
            this.renderer.setStyle(nativeElement, 'height', `${height}px`);
        });
    }

    showContentInfoAPP(contentInfoAPP) {
        var nameEvent = 'showContentInfoAPP';
        this.lauchEvent(nameEvent);
        let ngbModalOptions: NgbModalOptions = {
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
        this.modalReference = this.modalService.open(contentInfoAPP, ngbModalOptions);
    }

    dataAnonymize(anonymization) {
        this.hasAnonymize = false;
        this.resultAnonymized = '';
        this.copyResultAnonymized = '';

                if (anonymization.hasPersonalInfo) {
                    this.resultAnonymized = anonymization.anonymizedTextHtml;
                    this.copyResultAnonymized = anonymization.anonymizedText;
                    this.medicalTextOriginal = this.copyResultAnonymized;
                    this.medicalTextEng = this.copyResultAnonymized;
                    this.hasAnonymize = true;
                    if (!localStorage.getItem('dontShowSwal')) {
                        const detectePer = this.translate.instant("diagnosis.detected personal information");
                        const procDelete = this.translate.instant("diagnosis.proceeded to delete");
                        const msgcheck = this.translate.instant("land.check");
                        Swal.fire({
                            icon: 'info',
                            html: `<p>${detectePer}</p><p>${procDelete}</p><br><br><input type="checkbox" id="dont-show-again" class="me-1">${msgcheck}`,
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        }).then((result) => {
                            if ((document.getElementById('dont-show-again') as HTMLInputElement).checked) {
                                localStorage.setItem('dontShowSwal', 'true');
                            }
                        });
                    } else {
                        this.mostrarFinalizacionAnonimizado(true);
                    }
                }else{
                    this.hasAnonymize = false;
                    this.mostrarFinalizacionAnonimizado(false);
                }
            
    }

    mostrarFinalizacionAnonimizado(detectedText) {
        if (this.tienePrisa) {
            const message = detectedText 
                ? this.translate.instant("diagnosis.correctly anonymized") 
                : this.translate.instant("diagnosis.not detected personal information");
            
            Swal.fire({
                icon: 'success',
                html: message,
                showCancelButton: false,
                showConfirmButton: true,
                allowOutsideClick: false
            }).then((result) => {
                if (this.modalReference != undefined) {
                    this.modalReference.close();
                    this.modalReference = undefined;
                }
            });
    
            this.tienePrisa = false;
        }
    }

    openAnonymize(contentviewDoc) {
        let ngbModalOptions: NgbModalOptions = {
            keyboard: false,
            windowClass: 'ModalClass-sm' // xl, lg, sm
        };
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
        this.modalReference = this.modalService.open(contentviewDoc, ngbModalOptions);
    }

    closeModal() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
    }

    async openDescripModal(panel) {
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        this.editmedicalText = this.medicalTextOriginal;
        this.modalReference = this.modalService.open(panel, ngbModalOptions);
        await this.delay(500);
      setTimeout(() => {
        const modalElement = document.getElementById('textareaedit');
        if (modalElement) {
          this.textareaEdit = new ElementRef(modalElement);
          if (this.textareaEdit) {
            const textarea = this.textareaEdit.nativeElement as HTMLTextAreaElement;
            this.resizeTextArea2(textarea);
          }
        }
      }, 0);       
        
    }

    resizeTextArea2(textarea: HTMLTextAreaElement) {
        const maxHeight = 500; // altura máxima en píxeles
        
        textarea.style.height = 'auto';
        const newHeight = textarea.scrollHeight + 10;
        const finalHeight = Math.min(Math.max(newHeight, 100), maxHeight);
        textarea.style.height = finalHeight + 'px';
        textarea.style.overflowY = newHeight > maxHeight ? 'auto' : 'hidden';
    }

    async checkText() {
        this.showErrorCall1 = false;
        if (this.callingAI || this.editmedicalText.length < 15) {
            this.showErrorCall1 = true;
            let text = this.translate.instant("land.required");
            if (this.editmedicalText.length > 0) {
                let introText = this.translate.instant("land.charactersleft", {
                    value: (15 - this.editmedicalText.length)
                })
                text = text + '<br><br>' + introText;
            }
            let introText2 = this.translate.instant("land.recommended");
            text = text + '<br><br>' + introText2;
            this.showError(text, null);
        }
        if (!this.showErrorCall1) {
            let characters = this.countCharacters(this.editmedicalText);
            if (characters > 400000) {
                Swal.fire({
                  title: this.translate.instant("generics.textTooLongMax"),
                  text: this.translate.instant("generics.textTooLongMaxModel"),
                  icon: 'info',
                  confirmButtonText: 'Ok'
                });
                return;
              }
            if(characters > 8000) {
                let errorMessage = this.translate.instant("generics.excessCharacters", {
                    excessCharacters: characters
                });
                this.insightsService.trackEvent(errorMessage);
                Swal.fire({
                    title: this.translate.instant("generics.textTooLongMax"),
                    html: this.translate.instant("generics.textTooLongMaxMessage") + '<br><br>' + this.translate.instant("generics.recommendedLength") + '<br><br>' + this.translate.instant("generics.aiSummaryWarning"),
                    icon: 'info',
                    showDenyButton: true,
                    confirmButtonText: this.translate.instant("generics.ShortenWithAI"),
                    denyButtonText: this.translate.instant("generics.Shorten"),
                    allowOutsideClick: false
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        this.closeModal();
                        this.medicalTextOriginal = this.editmedicalText;
                        this.finishEditDescription();
                    } else if (result.isDenied) {
                        this.callAIForSummary('edit');
                    } else if (result.isDismissed) {
                        await this.delay(400);
                        document.getElementById('textareaedit').scrollIntoView({ behavior: "smooth" });
                    }
                });
                return;
            }
            if(characters > 3000) {
                Swal.fire({
                    title: this.translate.instant("generics.textTooLong"),
                    html: this.translate.instant("generics.textTooLongOptions") + '<br><br>' + this.translate.instant("generics.aiSummaryWarning"),
                    icon: 'info',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: this.translate.instant("generics.Continue"),
                    denyButtonText: this.translate.instant("generics.ShortenWithAI"),
                    cancelButtonText: this.translate.instant("generics.Shorten"),
                    allowOutsideClick: false
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        this.closeModal();
                        this.medicalTextOriginal = this.editmedicalText;
                        this.finishEditDescription();
                    } else if (result.isDenied) {
                        this.callAIForSummary('edit');
                    } else if (result.isDismissed) {
                        await this.delay(400);
                        document.getElementById('textareaedit').scrollIntoView({ behavior: "smooth" });
                    }
                });
                return;
            }
            this.closeModal();
            this.medicalTextOriginal = this.editmedicalText;
            this.finishEditDescription();
        }
    }

    finishEditDescription() {
        this.medicalTextEng = this.medicalTextOriginal;
        this.differentialTextOriginal = '';
        this.differentialTextTranslated = '';
        this.callAI(this.model);
    }


    // Nuevos métodos para la funcionalidad de preguntas de seguimiento
    
    async handleFollowUpResponse(contentFollowUp?) {
        this.showFollowUpQuestions = false;
        
        // Si el usuario no encuentra relevantes los diagnósticos, generamos preguntas de seguimiento
        this.lauchEvent("FollowUp - Solicitar más información");
        
        if (contentFollowUp) {
            let ngbModalOptions: NgbModalOptions = {
                backdrop: 'static',
                keyboard: false,
                windowClass: 'ModalClass-lg'
            };
            
            this.loadingFollowUpQuestions = true;
            
            if (this.modalReference != undefined) {
                this.modalReference.close();
            }
            
            this.modalReference = this.modalService.open(contentFollowUp, ngbModalOptions);
            
            // Generar preguntas de seguimiento basadas en la descripción actual
            await this.generateFollowUpQuestions();
        }
    }

    changeModeFunctionality(){
        const currentTime = new Date().getTime();
        
        // Reiniciar contador si han pasado más de 3 segundos desde el último clic
        if (currentTime - this.lastClickTime > 3000) {
            this.clickCounter = 0;
        }
        
        // Incrementar contador y actualizar tiempo
        this.clickCounter++;
        this.lastClickTime = currentTime;
        
        // Cambiar modeFunctionality solo si se han registrado 5 clics rápidos
        if (this.clickCounter >= 5) {
            this.modeFunctionality = !this.modeFunctionality;
            this.clickCounter = 0; // Reiniciar contador después de activar
            console.log('Modo de funcionalidad cambiado:', this.modeFunctionality);
        }
    }

    async handleERResponse(contentFollowUp?) {
        this.showFollowUpQuestions = false;
        
        // Si el usuario no encuentra relevantes los diagnósticos, generamos preguntas de seguimiento
        this.lauchEvent("FollowUp - Solicitar más información");
        
        if (contentFollowUp) {
            let ngbModalOptions: NgbModalOptions = {
                backdrop: 'static',
                keyboard: false,
                windowClass: 'ModalClass-lg'
            };
            
            this.loadingFollowUpQuestions = true;
            
            if (this.modalReference != undefined) {
                this.modalReference.close();
            }
            
            this.modalReference = this.modalService.open(contentFollowUp, ngbModalOptions);
            
            // Generar preguntas de seguimiento basadas en la descripción actual
            await this.generateERQuestions();
        }
    }

    

    async generateERQuestions() {
        // Llamar a la API para generar preguntas de seguimiento
        const value = { 
            description: this.medicalTextOriginal, 
            myuuid: this.myuuid, 
            lang: this.lang,
            timezone: this.timezone 
        };
        
        this.subscription.add(
            this.apiDx29ServerService.generateERQuestions(value).subscribe(
                (res: any) => {
                    if (res.result === 'success' && res.data && res.data.questions) {
                        this.followUpQuestions = res.data.questions;
                        this.followUpAnswers = {};
                        this.loadingFollowUpQuestions = false;
                    } else {
                        this.handleFollowUpQuestionsError(res);
                    }
                },
                (err) => {
                    this.handleFollowUpQuestionsError(err);
                }
            )
        );
    }
    
    async generateFollowUpQuestions() {
        // Llamar a la API para generar preguntas de seguimiento
        const value = { 
            description: this.medicalTextEng, 
            diseases: this.diseaseListEn.slice(0, 5).join(', '), 
            myuuid: this.myuuid,
            lang: this.lang,
            timezone: this.timezone 
        };
        
        this.subscription.add(
            this.apiDx29ServerService.generateFollowUpQuestions(value).subscribe(
                (res: any) => {
                    if (res.result === 'success' && res.data && res.data.questions) {
                        this.followUpQuestions = res.data.questions;
                        this.followUpAnswers = {};
                        this.loadingFollowUpQuestions = false;
                    } else {
                        this.handleFollowUpQuestionsError(res);
                    }
                },
                (err) => {
                    this.handleFollowUpQuestionsError(err);
                }
            )
        );
    }
    
    handleFollowUpQuestionsError(err: any) {
        console.log(err);
        let msgError = this.translate.instant("generics.error try again");
        if (err && err.error && err.error.message) {
            msgError = this.translate.instant("generics.error try again");
        }
        this.showError(msgError, err);
        this.loadingFollowUpQuestions = false;
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
    }
    
    updateFollowUpAnswer(questionIndex: number, answer: string) {
        this.followUpAnswers[questionIndex] = answer;
    }
    
    hasAnswers(): boolean {
        return Object.keys(this.followUpAnswers).length > 0;
    }
    
    async processFollowUpAnswers() {
        if (!this.hasAnswers()) {
            const msgError = this.translate.instant("land.Please answer at least one question");
            this.showError(msgError, null);
            return;
        }
        
        this.processingFollowUpAnswers = true;
        
        // Preparar las respuestas para enviarlas
        const answeredQuestions = [];
        
        for (let i = 0; i < this.followUpQuestions.length; i++) {
            // Solo incluir preguntas que tienen respuestas
            if (this.followUpAnswers[i] && this.followUpAnswers[i].trim() !== '') {
                // Asegurarnos de extraer correctamente el texto de la pregunta
                // Si followUpQuestions[i] es un string, usarlo directamente
                // Si es un objeto, intentar acceder a la propiedad de texto adecuada
                let questionText = this.followUpQuestions[i];
                
                // Si questionText es un objeto y tiene una propiedad de texto
                if (typeof questionText === 'object' && questionText !== null) {
                    // Intentar diferentes propiedades comunes para el texto de la pregunta
                    questionText = questionText.text || questionText.question || 
                                 questionText.content || questionText.value || 
                                 JSON.stringify(questionText);
                }
                
                answeredQuestions.push({
                    question: questionText,
                    answer: this.followUpAnswers[i]
                });
            }
        }
        
        // Llamar a la API para procesar las respuestas y actualizar la descripción
        const value = { 
            description: this.medicalTextEng, 
            answers: answeredQuestions,
            myuuid: this.myuuid,
            lang: this.lang,
            timezone: this.timezone 
        };
        if(this.modeFunctionality && this.medicalTextEng ==''){
            value.description = this.medicalTextOriginal;
        }
        

        this.subscription.add(
            this.apiDx29ServerService.processFollowUpAnswers(value).subscribe(
                (res: any) => {
                    if (res.result === 'success' && res.data && res.data.updatedDescription) {
                        // Actualizar la descripción con la información adicional
                        this.medicalTextOriginal = res.data.updatedDescription;
                        this.medicalTextEng = res.data.updatedDescription;
                        
                        // Cerrar el modal
                        if (this.modalReference != undefined) {
                            this.modalReference.close();
                        }
                        
                        // Realizar una nueva búsqueda con la descripción actualizada
                        this.processingFollowUpAnswers = false;
                        this.callAI(this.model);
                        
                        this.lauchEvent("FollowUp - Descripción actualizada");
                    } else {
                        this.handleProcessFollowUpAnswersError(res);
                    }
                },
                (err) => {
                    this.handleProcessFollowUpAnswersError(err);
                }
            )
        );
    }
    
    handleProcessFollowUpAnswersError(err: any) {
        console.log(err);
        let msgError = this.translate.instant("generics.error try again");
        if (err && err.error && err.error.message) {
            msgError = this.translate.instant("generics.error try again");
        }
        this.showError(msgError, err);
        this.processingFollowUpAnswers = false;
    }
    
    skipFollowUpQuestions() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
        this.lauchEvent("FollowUp - Omitir preguntas");
    }

    callAIForSummary(option: string) {
        Swal.fire({
            title: this.translate.instant("generics.Please wait"),
            html: this.translate.instant("generics.summarizingText"),
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false
        });

        let text = '';
        if(option == 'edit'){
            text = this.editmedicalText;
        } else {
            text = this.medicalTextOriginal;
        }
        const value = {
            description: text,
            myuuid: this.myuuid,
            lang: this.lang,
            timezone: this.timezone
        };

        this.subscription.add(
            this.apiDx29ServerService.summarizeText(value).subscribe(
                async (res: any) => {
                    if (res.result === 'success' && res.data && res.data.summary) {
                        if(option == 'edit'){
                            this.editmedicalText = res.data.summary;
                        } else {
                            this.medicalTextOriginal = res.data.summary;
                            this.medicalTextEng = res.data.summary;
                        }
                        Swal.close();
                        
                        // Usar setTimeout para asegurar que el DOM se actualice antes de redimensionar
                        setTimeout(async () => {
                            if(option=='edit'){
                                await this.delay(500);
                                setTimeout(() => {
                                  const modalElement = document.getElementById('textareaedit');
                                  if (modalElement) {
                                    this.textareaEdit = new ElementRef(modalElement);
                                    if (this.textareaEdit) {
                                      const textarea = this.textareaEdit.nativeElement as HTMLTextAreaElement;
                                      this.resizeTextArea2(textarea);
                                    }
                                  }
                                }, 0);
                            }else{
                                if (this.textAreas) {
                                    this.textAreas.forEach(textArea => {
                                        const element = textArea.nativeElement;
                                        element.style.height = 'auto';
                                        element.style.height = element.scrollHeight + 'px';
                                        // Asegurar un tamaño mínimo
                                        if (element.scrollHeight < 100) {
                                            element.style.height = '100px';
                                        }
                                    });
                                }
                            }
                            
                            
                            Swal.fire({
                                icon: 'info',
                                title: this.translate.instant("generics.Please review the summary"),
                                showConfirmButton: true,
                                allowOutsideClick: true,
                                didClose: () => {
                                    if(option=='edit'){
                                        document.getElementById('textareaedit').scrollIntoView({ behavior: "smooth" });
                                    }else{
                                        document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
                                    }
                                }
                            });
                        }, 0);
                    } else {
                        this.handleSummarizeError(res);
                    }
                },
                (err) => {
                    this.handleSummarizeError(err);
                }
            )
        );
    }

    handleSummarizeError(err: any) {
        console.log(err);
        let msgError = this.translate.instant("generics.error try again");
        if (err && err.error && err.error.message) {
            msgError = this.translate.instant("generics.error try again");
        }
        this.showError(msgError, err);
    }

    private startQueueStatusCheck() {
        this.cancelQueueStatusCheck();
        this.checkQueueStatus(); // Llama la primera vez
    }

    private cancelQueueStatusCheck() {
        if (this.queueStatusTimeout) {
            clearTimeout(this.queueStatusTimeout);
            this.queueStatusTimeout = null;
        }
    }

    private checkQueueStatus() {
        if (!this.currentTicketId) return;

        this.subscription.add(
            this.apiDx29ServerService.getQueueStatus(this.currentTicketId, this.timezone).subscribe(
                (res: any) => {
                    console.log('Queue status update:', res);
                    // Verificar si la respuesta tiene el formato esperado
                    if (res.result === 'success') {
                        if (res.status === 'completed') {
                            // La solicitud está completa
                            //this.cancelQueueStatusCheck();
                            if(res.data.data){
                                this.processAiSuccess(res.data, {});
                            }
                            //this.processAiSuccess(res.data, {});
                        } else if (res.status === 'processing' || res.status === 'queued') {
                            // Actualizar la posición y reiniciar el contador si cambió
                            if (this.currentPosition !== res.position) {
                                console.log('Position changed from', this.currentPosition, 'to', res.position);
                                this.currentPosition = res.position;
                                
                                // Solo actualizar el tiempo estimado si es menor al actual
                                const currentEstimatedTime = this.totalWaitTime ? this.totalWaitTime / (60 * 1000) : Infinity;
                                if (res.estimatedWaitTime < currentEstimatedTime) {
                                    console.log('Estimated wait time improved from', currentEstimatedTime, 'to', res.estimatedWaitTime);
                                    this.startCountdown(res.estimatedWaitTime);
                                }
                                
                                // Forzar la actualización del modal
                                this.updateQueueStatusModal(res.position, res.estimatedWaitTime);
                            }
                            // Programa el siguiente chequeo SOLO después de 10 segundos
                             this.queueStatusTimeout = setTimeout(() => this.checkQueueStatus(), 10000);
                        }
                    } 
                    // Manejar el caso cuando la respuesta tiene un formato diferente
                    else if (res.result === 'queued' && res.status === 'processing') {
                        console.log('Received direct queue status update:', res);
                        if (this.currentPosition !== res.position) {
                            console.log('Position changed from', this.currentPosition, 'to', res.position);
                            this.currentPosition = res.position;
                            
                            // Solo actualizar el tiempo estimado si es menor al actual
                            const currentEstimatedTime = this.totalWaitTime ? this.totalWaitTime / (60 * 1000) : Infinity;
                            if (res.estimatedWaitTime < currentEstimatedTime) {
                                console.log('Estimated wait time improved from', currentEstimatedTime, 'to', res.estimatedWaitTime);
                                this.startCountdown(res.estimatedWaitTime);
                            }
                            
                            // Forzar la actualización del modal
                            this.updateQueueStatusModal(res.position, res.estimatedWaitTime);
                        }
                        // Programa el siguiente chequeo SOLO después de 10 segundos
                        this.queueStatusTimeout = setTimeout(() => this.checkQueueStatus(), 10000);
                    } else if (res.result === 'error') {
                        // Si hay error, cancela el chequeo y muestra mensaje si quieres
                        console.error('Error en el estado de la cola:', res.message);
                        this.cancelQueueStatusCheck();
                        // Aquí podrías mostrar un mensaje al usuario, por ejemplo:
                        // this.errorMessage = res.message;
                    }
                },
                (err) => {
                    console.error('Error checking queue status:', err);
                    this.insightsService.trackException(err);
                    this.cancelQueueStatusCheck();
                }
            )
        );
    }
    
    private updateQueueStatusModal(position: number, estimatedWaitTime: number) {
        if (!this.currentTicketId) return;
        // Obtener todas las traducciones necesarias
        const translations = {
            inQueue: this.translate.instant("generics.Your request is in queue"),
            position: this.translate.instant("generics.Position"),
            estimatedTime: this.translate.instant("generics.Estimated wait time"),
            minutes: this.translate.instant("generics.minutes"),
            seconds: this.translate.instant("generics.seconds"),
            keepOpen: this.translate.instant("generics.Please keep this window open")
        };
        
        // Calcular el tiempo restante
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.totalWaitTime - elapsedTime);
        const progressValue = Math.min(100, ((elapsedTime / this.totalWaitTime) * 100));
        
        const remainingMinutes = Math.floor(remainingTime / (60 * 1000));
        const remainingSeconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
        
        // Actualizar el modal con la nueva información
        Swal.update({
            html: `
                <div class="queue-status-message" style="text-align: center; margin: 20px 0;">
                    <p style="color: #666; margin: 10px 0;">${translations.inQueue}</p>
                    <div style="background: #f3f3f3; border-radius: 10px; padding: 15px; margin: 15px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #666;">${translations.position}:</span>
                            <span style="font-weight: bold; color: #333;">#${position}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">${translations.estimatedTime}:</span>
                            <span style="font-weight: bold; color: #333;">${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                    <div style="background: #e8e8e8; height: 8px; border-radius: 4px; margin: 20px 0;">
                        <div style="background: #4CAF50; width: ${progressValue}%; height: 100%; border-radius: 4px; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: center; margin-top: 15px;">
                        <div class="queue-spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite;"></div>
                        <span style="color: #666; margin-left: 10px;">${translations.keepOpen}</span>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `
        });
    }

    private startCountdown(estimatedWaitTime: number) {
        // Limpiar contador anterior si existe
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        this.startTime = Date.now();
        this.totalWaitTime = estimatedWaitTime * 60 * 1000; // convertir minutos a milisegundos

        this.countdownInterval = setInterval(() => {
            const elapsedTime = Date.now() - this.startTime;
            const remainingTime = Math.max(0, this.totalWaitTime - elapsedTime);
            const progressValue = Math.min(100, ((elapsedTime / this.totalWaitTime) * 100));
            
            const remainingMinutes = Math.floor(remainingTime / (60 * 1000));
            const remainingSeconds = Math.floor((remainingTime % (60 * 1000)) / 1000);

            // Obtener todas las traducciones necesarias
            const translations = {
                inQueue: this.translate.instant("generics.Your request is in queue"),
                position: this.translate.instant("generics.Position"),
                estimatedTime: this.translate.instant("generics.Estimated wait time"),
                minutes: this.translate.instant("generics.minutes"),
                seconds: this.translate.instant("generics.seconds"),
                keepOpen: this.translate.instant("generics.Please keep this window open")
            };

            // Actualizar el modal con la nueva información
            Swal.update({
                html: `
                    <div class="queue-status-message" style="text-align: center; margin: 20px 0;">
                        <p style="color: #666; margin: 10px 0;">${translations.inQueue}</p>
                        <div style="background: #f3f3f3; border-radius: 10px; padding: 15px; margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span style="color: #666;">${translations.position}:</span>
                                <span style="font-weight: bold; color: #333;">#${this.currentPosition}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #666;">${translations.estimatedTime}:</span>
                                <span style="font-weight: bold; color: #333;">${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}</span>
                            </div>
                        </div>
                        <div style="background: #e8e8e8; height: 8px; border-radius: 4px; margin: 20px 0;">
                            <div style="background: #4CAF50; width: ${progressValue}%; height: 100%; border-radius: 4px; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: center; margin-top: 15px;">
                            <div class="queue-spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite;"></div>
                            <span style="color: #666; margin-left: 10px;">${translations.keepOpen}</span>
                        </div>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `
            });

            // Si el tiempo ha terminado, limpiar el intervalo
            if (remainingTime <= 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000); // Actualizar cada segundo
    }

    // Método para iniciar la animación de typing
    startTypingAnimation() {
        // Limpiar cualquier intervalo existente
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }
        
        // Asegurarse de que fullPlaceholderText esté actualizado si aún no se ha establecido
        if (!this.fullPlaceholderText) {
            this.fullPlaceholderText = this.translate.instant('land.Placeholder help');
        }
        
        this.textareaPlaceholder = '';
        
        let currentIndex = 0;
        const charsPerStep = 3; // Mostrar 3 caracteres en cada paso
        
        // Crear un nuevo intervalo para el efecto de typing
        this.typingInterval = setInterval(() => {
            if (currentIndex < this.fullPlaceholderText.length) {
                // Determinar cuántos caracteres añadir en este paso
                const charsToAdd = Math.min(charsPerStep, this.fullPlaceholderText.length - currentIndex);
                this.textareaPlaceholder = this.fullPlaceholderText.substring(0, currentIndex + charsToAdd);
                currentIndex += charsToAdd;
            } else {
                // Una vez completado, detener el intervalo
                clearInterval(this.typingInterval);
            }
        }, 40); // Velocidad de typing moderada
    }

    focusTextArea() {
        // Detener la animación y limpiar el placeholder
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }
        this.textareaPlaceholder = '';
    }

    restorePlaceholder() {
        if (!this.medicalTextOriginal || this.medicalTextOriginal.trim() === '') {
            // Reiniciar la animación
            this.startTypingAnimation();
        }
    }
/*
    onFilesSelected(event: any) {
        console.log(event);
        if (event.target.files && event.target.files.length > 0) {
            // Añadir los archivos seleccionados al array, evitando duplicados por nombre y tamaño
            const newFiles = Array.from(event.target.files) as File[];
            newFiles.forEach(file => {
                if (!this.selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    this.selectedFiles.push(file);
                }
            });
            this.filesAnalyzed = false;
            this.filesModifiedAfterAnalysis = true; // Marcar como modificado
            this.lauchEvent('Files selected: ' + newFiles.map(f => f.name).join(', '));
        }
    }

    removeFile(index: number) {
        const removedFile = this.selectedFiles[index];
        this.selectedFiles.splice(index, 1);
        if (this.selectedFiles.length === 0) {
            this.filesAnalyzed = false;
            this.filesModifiedAfterAnalysis = false; // Resetear si no hay archivos
        } else {
            this.filesModifiedAfterAnalysis = true; // Marcar como modificado
        }
        this.lauchEvent('File removed: ' + (removedFile ? removedFile.name : 'unknown'));
    }

    analyzeMultimodal() {
        // Mostrar spinner con Swal
        Swal.close();
        Swal.fire({
            html: '<p>' + this.translate.instant("land.swalMultimodal") + '</p>' +
                  '<p>' + this.translate.instant("land.swal2Multimodal") + '</p>' +
                  '<p>' + this.translate.instant("land.swal3Multimodal") + '</p>' +
                  '<p><em class="primary fa fa-spinner fa-3x fa-spin fa-fw"></em></p>',
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: this.translate.instant("generics.Cancel"),
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then(function (event) {
            if (event.dismiss == Swal.DismissReason.cancel) {
                this.callingAI = false;
                this.subscription.unsubscribe();
                this.subscription = new Subscription();
                this.lauchEvent('User cancelled multimodal analysis');
            }
        }.bind(this));

        this.lauchEvent('Analyze multimodal started');
        this.callingAI = true;
        const formData = new FormData();
        formData.append('text', this.medicalTextOriginal || '');
        // Solo un documento y una imagen según backend, priorizar el primero de cada tipo
        let docAdded = false;
        let imgAdded = false;
        for (const file of this.selectedFiles) {
            if (!docAdded && [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain'
            ].includes(file.type)) {
                formData.append('document', file);
                docAdded = true;
                this.lauchEvent('Document file added: ' + file.name);
            } else if (!imgAdded && file.type.startsWith('image/')) {
                formData.append('image', file);
                imgAdded = true;
                this.lauchEvent('Image file added: ' + file.name);
            }
            if (docAdded && imgAdded) break;
        }
        formData.append('lang', this.lang || 'es');
        formData.append('myuuid', this.myuuid || '');
        formData.append('timezone', this.timezone || '');

        this.apiDx29ServerService.analyzeMultimodal(formData).pipe(first()).subscribe({
            next: (res: any) => {
                this.summary = res.summary;
                this.details = res.details;
                this.detectedLang = res.detectedLang;
                // Concatenar el resumen al texto principal
                if (res.summary) {
                    if (this.medicalTextOriginal && !this.medicalTextOriginal.endsWith('\n')) {
                        this.medicalTextOriginal += '\n';
                    }
                    this.medicalTextOriginal += res.summary;
                }
                this.callingAI = false;
                Swal.close();
                setTimeout(async () => {
                    if (this.textAreas) {
                        this.textAreas.forEach(textArea => {
                            const element = textArea.nativeElement;
                            element.style.height = 'auto';
                            element.style.height = element.scrollHeight + 'px';
                            // Asegurar un tamaño mínimo
                            if (element.scrollHeight < 100) {
                                element.style.height = '100px';
                            }
                        });
                    }
                    // Mostrar Swal informativo
                    Swal.fire({
                        icon: 'info',
                        title: this.translate.instant('diagnosis.Text generated'),
                        html: `
                          <p>${this.translate.instant('diagnosis.We have processed your inputs')}</p>
                          <p>${this.translate.instant('diagnosis.Please review the text')}</p>
                        `,
                        confirmButtonText: 'Ok',
                        showCancelButton: false
                    });
                    this.filesAnalyzed = true;
                    this.filesModifiedAfterAnalysis = false; // Resetear el estado de modificaciones
                }, 0);
                this.lauchEvent('Analyze multimodal success');
            },
            error: (err) => {
                this.callingAI = false;
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: this.translate.instant('generics.error'),
                    text: this.translate.instant('land.errorAnalyze') || 'Error al analizar la información',
                    confirmButtonText: this.translate.instant('generics.Close')
                });
                this.lauchEvent('Analyze multimodal error: ' + (err?.message || 'unknown error'));
            }
        });
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files) as File[];
            newFiles.forEach(file => {
                if (!this.selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    this.selectedFiles.push(file);
                }
            });
            this.filesAnalyzed = false;
            this.filesModifiedAfterAnalysis = true; // Marcar como modificado
            this.lauchEvent('Files dropped: ' + newFiles.map(f => f.name).join(', '));
        }
    }

    triggerFileInput(fileInput: HTMLInputElement) {
        if (!this.callingAI) {
            fileInput.click();
        }
    }

    // Métodos para la nueva interfaz de botones
    getButtonText(): string {
        if (this.callingAI) {
            return this.translate.instant('generics.Processing');
        }
        
        if (this.selectedFiles.length > 0 && !this.filesAnalyzed) {
            return this.translate.instant('diagnosis.Analyze files and search');
        }
        
        return this.translate.instant('land.Search');
    }
        
    reanalyzeFiles() {
        this.filesAnalyzed = false;
        this.lauchEvent('Reanalyze files clicked');
        this.analyzeMultimodal();
    }
        
    */

    getButtonTitle(): string {
        if (this.callingAI) {
            return this.translate.instant('generics.Please wait');
        }
        
        if (this.medicalTextOriginal.length < 5) {
            return this.translate.instant('land.placeholderError');
        }
        
        if (this.selectedFiles.length > 0 && !this.filesAnalyzed) {
            return this.translate.instant('diagnosis.Analyze uploaded files and search for diagnoses');
        }
        
        return this.translate.instant('land.Search');
    }

    

}