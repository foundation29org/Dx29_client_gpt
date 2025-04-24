import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ViewChildren, QueryList, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EventsService } from 'app/shared/services/events.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { Clipboard } from "@angular/cdk/clipboard"
import { v4 as uuidv4 } from 'uuid';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { FeedbackPageComponent } from 'app/pages/land/feedback/feedback-page.component';
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
    modalReference2: NgbModalRef;
    topRelatedConditions: any = [];
    diseaseListEn: any = [];
    diseaseListText: string = '';
    lang: string = 'en';
    originalLang: string = 'en';
    detectedLang: string = 'en';
    selectedInfoDiseaseIndex: number = -1;
    _startTime: any;
    myuuid: string = uuidv4();
    currentStep: number = 1;
    questions: any = [];
    answerOpenai: string = '';
    showErrorCall1: boolean = false;
    showErrorCall2: boolean = false;
    callingOpenai: boolean = false;
    loadingAnswerOpenai: boolean = false;
    selectedDisease: string = '';
    options: any = {};
    optionSelected: any = {};
    sendingVote: boolean = false;
    selectorOption: string = '';
    symtpmsLabel: string = '';
    feedBack1input: string = '';
    feedBack2input: string = '';
    sending: boolean = false;
    symptomsDifferencial: any = [];
    selectedQuestion: string = '';
    email: string = '';
    checkSubscribe: boolean = false;
    acceptTerms: boolean = false;
    loadMoreDiseases: boolean = false;
    currentTicketId: string = '';
    @ViewChild('f') feedbackDownForm: NgForm;
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

    private queueStatusInterval: any;
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

    constructor(private http: HttpClient, public translate: TranslateService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private eventsService: EventsService, public insightsService: InsightsService, private renderer: Renderer2, private route: ActivatedRoute) {
        this.initialize();
    }

    private initialize() {
        this.setLangFromSession();
        this._startTime = Date.now();
        this.setUUID();
        this.lauchEvent("Init Page");
        this.currentStep = 1;
        this.loadSponsors();
        this.loadingIP();
      }

      private setLangFromSession() {
        if (sessionStorage.getItem('lang') == null) {
          sessionStorage.setItem('lang', this.translate.store.currentLang);
        }
        this.lang = sessionStorage.getItem('lang');
        this.originalLang = sessionStorage.getItem('lang');
      }

      private setUUID() {
        if (sessionStorage.getItem('uuid') != null) {
          this.myuuid = sessionStorage.getItem('uuid');
        } else {
          this.myuuid = uuidv4();
          sessionStorage.setItem('uuid', this.myuuid);
        }
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
        this.route.queryParams.subscribe(params => {
            if (params['medicalText']) {
                this.medicalTextOriginal = params['medicalText'];
                setTimeout(() => {
                    const hiddenButton = document.getElementById('hiddenCheckPopupButton');
                    if (hiddenButton) {
                        (hiddenButton as HTMLElement).click();
                    }
                }, 500);
            }
        });
        this.subscribeToEvents();
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
            { id: 5, question: 'land.q5' }
        ];
        this.options = { id: 1, value: this.translate.instant("land.option1"), label: this.translate.instant("land.labelopt1"), description: this.translate.instant("land.descriptionopt1") };
    }

    subscribeToEvents() {
        this.eventsService.on('changelang', async (lang) => {
            this.lang = lang;
            this.loadTranslations();
            if (this.currentStep == 2 && this.originalLang != lang && this.topRelatedConditions.length>0) {
                Swal.fire({
                    title: this.translate.instant("land.Language has changed"),
                    text: this.translate.instant("land.Do you want to start over"),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#B30000',
                    cancelButtonColor: '#B0B6BB',
                    confirmButtonText: this.translate.instant("generics.Yes"),
                    cancelButtonText: this.translate.instant("generics.No"),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: false,
                    reverseButtons: true
                }).then((result) => {
                    if (result.value) {
                        this.originalLang = lang;
                        this.restartInitVars();
                        this.currentStep = 1;
                    }
                });
            }
        });
        this.eventsService.on('backEvent', async (event) => {
            console.log(event);
            console.log(this.currentStep);
            console.log(this.topRelatedConditions.length);
            if (this.currentStep == 2 && this.topRelatedConditions.length>0) {
                //ask for confirmation
                Swal.fire({
                    title: this.translate.instant("land.Do you want to start over"),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#B30000',
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
        
        // Desuscribirse de los eventos
        this.eventsService.off('changelang');
        this.eventsService.off('backEvent');
        
        // Cancelar todas las suscripciones
        this.subscription.unsubscribe();
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
        if (this.callingOpenai || this.medicalTextOriginal.length < 15) {
            this.showErrorCall1 = true;
            let text = this.translate.instant("land.required");
            if (this.medicalTextOriginal.length > 0) {
                text = this.translate.instant("land.requiredMIN5");
                let introText = this.translate.instant("land.charactersleft", {
                    value: (15 - this.medicalTextOriginal.length)
                })
                text = text + ' ' + introText;
            }
            this.showError(text, null);
            return;
        }
        let characters = this.countCharacters(this.medicalTextOriginal);
        if (characters > 400000) {
            Swal.fire({
              title: this.translate.instant("generics.textTooLongMax"),
              text: this.translate.instant("generics.textTooLongMaxModel"),
              icon: 'error',
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
                icon: 'error',
                showDenyButton: true,
                confirmButtonText: this.translate.instant("generics.ShortenWithAI"),
                denyButtonText: this.translate.instant("generics.Shorten"),
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    this.callOpenAiForSummary('new');
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
                icon: 'warning',
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
                            this.preparingCallOpenAi('step1');
                        }
                    }
                } else if (result.isDenied) {
                    this.callOpenAiForSummary('new');
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
                this.preparingCallOpenAi('step1');
            }
        }
    }

    closePopup() {
        this.preparingCallOpenAi('step1');
        if (this.modalReference != undefined) {
            this.modalReference.close();
        }
    }

    preparingCallOpenAi(step) {
        this.callingOpenai = true;
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
        this.continuePreparingCallOpenAi(step);
    }


    continuePreparingCallOpenAi(step) {
        if (step == 'step4') {
            this.callOpenAi(false);
        } else {
            Swal.fire({
                title: this.translate.instant("generics.Please wait"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {

            });
            this.callOpenAi(false);
        }

    }

    callOpenAi(newModel: boolean) {
        
        Swal.close();
        Swal.fire({
            html: '<p>' + this.translate.instant("land.swal") + '</p>' + '<p>' + this.translate.instant("land.swal2") + '</p>' + '<p>' + this.translate.instant("land.swal3") + '</p>' + '<p><em class="primary fa fa-spinner fa-2x fa-spin fa-fw"></em></p>',
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: this.translate.instant("generics.Cancel"),
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then(function (event) {
            if (event.dismiss == Swal.DismissReason.cancel) {
                this.callingOpenai = false;
                this.subscription.unsubscribe();
                this.subscription = new Subscription();
            }

        }.bind(this));

        this.callingOpenai = true;
        var value = { description: this.medicalTextEng, diseases_list: '', myuuid: this.myuuid, operation: 'find disease', lang: this.lang, timezone: this.timezone }
        if (this.loadMoreDiseases) {
            value = { description: this.medicalTextEng, diseases_list:this.diseaseListText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang, timezone: this.timezone }
        }
        if(newModel){
            this.subscription.add(
                this.apiDx29ServerService.postOpenAiNewModel(value).subscribe(
                    (res: any) => this.handleOpenAiResponse(res, value, newModel),
                    (err: any) => this.handleOpenAiError(err)
                )
            );
        }else{
            this.subscription.add(
                this.apiDx29ServerService.postOpenAi(value).subscribe(
                    (res: any) => this.handleOpenAiResponse(res, value, newModel),
                    (err: any) => this.handleOpenAiError(err)
                )
            );
        }
        
    }

    callNewModel(){
        this.lauchEvent('callNewModel');
        this.callingOpenai = true;
        this.medicalTextEng = this.medicalTextOriginal;
        this.differentialTextOriginal = '';
        this.differentialTextTranslated = '';
        this.callOpenAi(true);
    }

    callOldModel(){
        this.lauchEvent('callOldModel');
        this.callingOpenai = true;
        this.medicalTextEng = this.medicalTextOriginal;
        this.differentialTextOriginal = '';
        this.differentialTextTranslated = '';
        this.callOpenAi(false);
    }

    handleOpenAiResponse(res: any, value: any, newModel: boolean) {
       
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
                    this.callingOpenai = false;
                    this.subscription.unsubscribe();
                    this.subscription = new Subscription();
                }
            });
            return;
        }

        if (res.result) {
            switch (res.result) {
                case 'blocked':
                    msgError = this.translate.instant("land.errorLocation");
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'error':
                    msgError = this.translate.instant("generics.error try again");
                    msgError = msgError + '<br><br>' + this.translate.instant("generics.error edit patient description");
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'unsupported_language':
                    if(this.medicalTextEng.length > 100){
                        msgError = this.translate.instant("generics.unsupported language");
                    }else{
                        msgError = this.translate.instant("generics.minDescriptionLength");
                    }
                    
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'translation error':
                    msgError = this.translate.instant("generics.Translation error");
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'error openai':
                    msgError = this.translate.instant("generics.sorry cant anwser1");
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'error max tokens':
                    this.lauchEvent("error max tokens: "+this.medicalTextOriginal.length);
                    msgError = this.translate.instant("generics.sorry cant anwser3");
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'success':
                    this.model = newModel;
                    this.processOpenAiSuccess(res, value);
                    break;
                default:
                    this.showError(this.translate.instant("generics.error try again"), null);
                    this.callingOpenai = false;
            }
        } else {
            msgError = this.translate.instant("generics.error try again");
            this.showError(msgError, null);
            this.callingOpenai = false;
        }
    }

    handleOpenAiError(err: any) {
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
        this.callingOpenai = false;
    }

    showError(message: string, err: any) {
        Swal.close();
        Swal.fire({
            icon: 'error',
            html: message,
            showCancelButton: false,
            showConfirmButton: true,
            allowOutsideClick: false
        });
        this.callingOpenai = false;
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

    processOpenAiSuccess(data: any, value: any) {
        //if (this.currentStep == 1) {
            this.copyMedicalText = this.medicalTextEng;
            //}
            this.dataAnonymize(data.anonymization);//parseChoices0
            this.detectedLang = data.detectedLang;
            let parseChoices0 = data.data;
            if (!this.loadMoreDiseases) {
                this.diseaseListEn = [];
            }
            this.setDiseaseListEn(parseChoices0);
            this.continueCallOpenAi(parseChoices0);
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

    async continueCallOpenAi(parseChoices0) {
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
        this.callingOpenai = false;
        Swal.close();
        //window.scrollTo(0, 0);
         // Nueva conversión para la cuenta de display
        gtag('event', 'conversion', {
            'send_to': 'AW-16829919003/877dCLbc_IwaEJvekNk-'
        });
        this.lauchEvent("Search Disease");
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
        this.callOpenAi(this.model);
    }

    async scrollTo() {
        await this.delay(400);
        document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
    }

    cancelCallQuestion() {
        this.symptomsDifferencial = [];
        this.answerOpenai = '';
        this.loadingAnswerOpenai = false;
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
        this.answerOpenai = '';
        this.loadingAnswerOpenai = true;
        this.selectedQuestion = question.question;
        var selectedDiseaseEn = this.diseaseListEn[this.selectedInfoDiseaseIndex];
        let index2 = selectedDiseaseEn.indexOf('.');
        if (index2 != -1) {
            var temp = selectedDiseaseEn.split(".");
            selectedDiseaseEn = temp[1];
        }

        const infoOptionEvent = this.getInfoOptionEvent(index);
        this.lauchEvent(infoOptionEvent);

        var value = { questionType: index, disease: selectedDiseaseEn, medicalDescription: this.medicalTextEng,myuuid: this.myuuid, operation: 'info disease', lang: this.lang, timezone: this.timezone, detectedLang: this.detectedLang }
        this.subscription.add(this.apiDx29ServerService.callopenaiquestions(value)
            .subscribe((res: any) => {
                if (res.result === 'success') {
                    if (res.data.type === 'differential') {
                      this.symptomsDifferencial = res.data.symptoms;
                    } else {
                      this.answerOpenai = res.data.content;
                    }
                    this.loadingAnswerOpenai = false;
                    this.lauchEvent("Info Disease");
                  } else {
                    // Manejar errores según el tipo
                    let msgError = this.translate.instant(
                      res.result === 'blocked' ? "land.errorLocation" :
                      res.result === 'error openai' ? "generics.sorry cant anwser1" :
                      "generics.error try again"
                    );
                    this.showError(msgError, null);
                    this.loadingAnswerOpenai = false;
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
                this.loadingAnswerOpenai = false;
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
        if (this.callingOpenai || this.differentialTextOriginal.length == 0) {
            this.showErrorCall2 = true;
            let msgError = this.translate.instant("land.required");
            this.showError(msgError, null);
        }
        if (!this.showErrorCall2) {
            this.callOpenAiDifferential();
        }
    }

    callOpenAiDifferential() {
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
        this.preparingCallOpenAi('step4'); 
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
        this.answerOpenai = '';
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

    getPlainInfoDiseases2() {
        return this.topRelatedConditions.map(condition => condition.name).join("\n");
      }

      async downloadResults() {
        if (!this.callingAnonymize) {
            try {
                const { jsPDFService } = await import('app/shared/services/jsPDF.service');
                const pdfService = new jsPDFService(this.translate);
                pdfService.generateResultsPDF(this.medicalTextOriginal, this.topRelatedConditions, this.lang);
                this.lauchEvent('Download results');
            } catch (error) {
                console.error('Error loading PDF service:', error);
                this.insightsService.trackException(error);
            }
        }
    }

    getLiteral(literal) {
        return this.translate.instant(literal);
    }

    vote(valueVote, contentFeedbackDown) {
        this.sendingVote = true;

        var value = { value: this.symtpmsLabel + " " + this.medicalTextOriginal + " Call Text: " + this.medicalTextEng, myuuid: this.myuuid, operation: 'vote', lang: this.lang, vote: valueVote, topRelatedConditions: this.topRelatedConditions, isNewModel: this.model }
        this.subscription.add(this.apiDx29ServerService.opinion(value)
            .subscribe((res: any) => {
                this.lauchEvent("Vote: " + valueVote);
                this.sendingVote = false;
                /*if (valueVote == 'down') {
                    this.modalReference = this.modalService.open(contentFeedbackDown);
                } else {
                    let msgSuccess = this.translate.instant("land.thanks");
                    this.showSuccess(msgSuccess);
                }*/
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

    submitInvalidForm() {
        this.showErrorForm = true;
        if (!this.feedbackDownForm) { return; }
        const base = this.feedbackDownForm;
        for (const field in base.form.controls) {
            if (!base.form.controls[field].valid) {
                base.form.controls[field].markAsTouched()
            }
        }
    }

    onSubmitFeedbackDown() {
        this.showErrorForm = false;
        this.sending = true;

        var value = { email: this.feedBack2input, myuuid: this.myuuid, lang: this.lang, info: this.feedBack1input, value: this.symtpmsLabel + " " + this.medicalTextOriginal + " Call Text: " + this.medicalTextEng, topRelatedConditions: this.topRelatedConditions, subscribe: this.checkSubscribe, isNewModel: this.model }
        this.subscription.add(this.apiDx29ServerService.feedback(value)
            .subscribe((res: any) => {
                this.lauchEvent("Feedback");
                this.sending = false;
                this.feedBack1input = '';
                this.feedBack2input = '';
                this.checkSubscribe = false;
                this.acceptTerms = false;
                if (this.modalReference != undefined) {
                    this.modalReference.close();
                    this.modalReference = undefined;
                }
                let msgSuccess = this.translate.instant("land.thanks");
                this.showSuccess(msgSuccess);
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
                this.sending = false;
            }));


    }

    closeFeedback() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
        this.checkSubscribe = false;
        this.acceptTerms = false;
        let msgSuccess = this.translate.instant("land.thanks");
        this.showSuccess(msgSuccess);
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
            backdrop: 'static',
            keyboard: false,
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
        if (this.callingOpenai || this.editmedicalText.length < 15) {
            this.showErrorCall1 = true;
            let text = this.translate.instant("land.required");
            if (this.editmedicalText.length > 0) {
                text = this.translate.instant("land.requiredMIN5");
                let introText = this.translate.instant("land.charactersleft", {
                    value: (15 - this.editmedicalText.length)
                })
                text = text + ' ' + introText;
            }
            this.showError(text, null);
        }
        if (!this.showErrorCall1) {
            let characters = this.countCharacters(this.editmedicalText);
            if (characters > 400000) {
                Swal.fire({
                  title: this.translate.instant("generics.textTooLongMax"),
                  text: this.translate.instant("generics.textTooLongMaxModel"),
                  icon: 'error',
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
                    icon: 'error',
                    showDenyButton: true,
                    confirmButtonText: this.translate.instant("generics.ShortenWithAI"),
                    denyButtonText: this.translate.instant("generics.Shorten"),
                    allowOutsideClick: false
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        this.callOpenAiForSummary('edit');
                    } else if (result.isDenied) {
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
                    icon: 'warning',
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
                        this.callOpenAiForSummary('edit');
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
        this.callOpenAi(this.model);
    }

    async openModal2(panel) {
        let ngbModalOptions: NgbModalOptions = {
          backdrop : 'static',
            keyboard: false,
            windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference2 = this.modalService.open(panel, ngbModalOptions);
        await this.delay(400);
        document.getElementById('initpopup2').scrollIntoView(true);
      }
      
      onTermsAccepted() {
        this.acceptTerms = true;
        this.modalReference2.close();
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
            operation: 'generate ER questions', 
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
            operation: 'generate follow-up questions', 
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
            operation: 'process follow-up answers', 
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
                        this.callOpenAi(this.model);
                        
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

    callOpenAiForSummary(option: string) {
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
            operation: 'summarize text',
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
        // Limpiar cualquier intervalo existente
        this.cancelQueueStatusCheck();
        
        // Iniciar nuevo intervalo
        this.queueStatusInterval = setInterval(() => {
            this.checkQueueStatus();
        }, this.QUEUE_CHECK_INTERVAL);
    }

    private cancelQueueStatusCheck() {
        if (this.queueStatusInterval) {
            clearInterval(this.queueStatusInterval);
            this.queueStatusInterval = null;
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
                            this.cancelQueueStatusCheck();
                            this.processOpenAiSuccess(res.data, {});
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

    // Agregar este método después del método resizeTextArea() o en una ubicación lógica
    focusTextArea() {
        if (this.mainTextArea) {
            const element = this.mainTextArea.nativeElement;
            element.placeholder = '';
            element.focus();
        }
    }

    restorePlaceholder() {
        if (this.mainTextArea) {
            const element = this.mainTextArea.nativeElement;
            if (!this.medicalTextOriginal || this.medicalTextOriginal.trim() === '') {
                element.placeholder = this.translate.instant('land.Placeholder help');
            }
        }
    }

}