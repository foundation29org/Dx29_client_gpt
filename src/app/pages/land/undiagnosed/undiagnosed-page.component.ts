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
import { GoogleAnalyticsService } from 'ngx-google-analytics';

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
    @ViewChild('f') feedbackDownForm: NgForm;
    showErrorForm: boolean = false;
    sponsors = [];

    hasAnonymize: boolean = false;
    callingAnonymize: boolean = false;
    tienePrisa: boolean = false;
    resultAnonymized: string = '';
    copyResultAnonymized: string = '';
    ip: string = '29.29.29.29';
    timezone: string = '';
    feedbackTimestampDxGPT = localStorage.getItem('feedbackTimestampDxGPT');
    threeMonthsAgo = Date.now() - (3 * 30 * 24 * 60 * 60 * 1000); // 3 meses
    terms2: boolean = false;

    @ViewChildren('autoajustable') textAreas: QueryList<ElementRef>;
    //@ViewChild('autoajustable2', { static: false }) textareaEdit: ElementRef;
    @ViewChild('textareaedit') textareaEdit: ElementRef;

    constructor(private http: HttpClient, public translate: TranslateService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private eventsService: EventsService, public insightsService: InsightsService, private renderer: Renderer2, private route: ActivatedRoute, private gaService: GoogleAnalyticsService) {
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
                if (res.ip) {
                    this.ip = res.ip
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
            this.gaService.gtag('event', subcate, { 'myuuid': this.myuuid, 'event_label': secs });
            subcate = 'Info quest - ' + this.selectedDisease + ' - ' + this.selectedQuestion
            this.gaService.gtag('event', subcate, { 'myuuid': this.myuuid, 'event_label': secs });

        }else{
            this.gaService.gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });

        }
    }

    ngOnInit() {
        this.loadTranslations();
        this.route.queryParams.subscribe(params => {
            if (params['medicalText']) {
                this.medicalTextOriginal = params['medicalText'];
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
            if (this.currentStep == 2 && this.originalLang != lang) {
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
            if (this.currentStep == 2) {
                this.newPatient();
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
        }
        let words = this.countWords(this.medicalTextOriginal);
        if(words>3000){
            let excessWords = words - 3000;
            let errorMessage = this.translate.instant("generics.exceedingWords", {
                excessWords: excessWords
              });
              Swal.fire({
                icon: 'error',
                html: errorMessage,
                showCancelButton: false,
                showConfirmButton: true,
                allowOutsideClick: false
                });
            this.insightsService.trackEvent(errorMessage);
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

    preparingCallOpenAi2(step) {
        this.callingOpenai = true;
        if (step == 'step4') {
            var labelMoreSymptoms = this.translate.instant("land.msgmoresymptoms")
            if (this.medicalTextOriginal.indexOf(labelMoreSymptoms) == -1) {
                this.copyMedicalText = this.copyMedicalText + '. ' + this.optionSelected.value + ' ' + this.differentialTextTranslated
                this.medicalTextOriginal = this.medicalTextOriginal + '. ' + labelMoreSymptoms + ' ' + this.differentialTextOriginal;
            } else {
                this.copyMedicalText = this.copyMedicalText + ', ' + this.differentialTextTranslated
                this.medicalTextOriginal = this.medicalTextOriginal + ', ' + this.differentialTextOriginal;
            }
            this.medicalTextEng = this.copyMedicalText;
        }else {
            this.medicalTextEng = this.medicalTextOriginal;
        }
        this.differentialTextOriginal = '';
        this.differentialTextTranslated = '';
        this.continuePreparingCallOpenAi(step);
    }


    continuePreparingCallOpenAi(step) {
        if (step == 'step3' || step == 'step4') {
            this.callOpenAi();
        } else {
            Swal.fire({
                title: this.translate.instant("generics.Please wait"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {

            });
            this.callOpenAi();
        }

    }

    callOpenAi() {
        Swal.close();
        Swal.fire({
            html: '<p>' + this.translate.instant("land.swal") + '</p>' + '<p>' + this.translate.instant("land.swal2") + '</p>' + '<p><em class="primary fa fa-spinner fa-2x fa-spin fa-fw"></em></p>',
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
        var value = { description: this.medicalTextEng, diseases_list: '', myuuid: this.myuuid, operation: 'find disease', lang: this.lang, ip: this.ip, timezone: this.timezone }
        if (this.loadMoreDiseases) {
            value = { description: this.medicalTextEng, diseases_list:this.diseaseListText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang, ip: this.ip, timezone: this.timezone }
        }

        this.subscription.add(
            this.apiDx29ServerService.postOpenAi(value).subscribe(
                (res: any) => this.handleOpenAiResponse(res, value),
                (err: any) => this.handleOpenAiError(err)
            )
        );
    }

    handleOpenAiResponse(res: any, value: any) {
        let msgError = this.translate.instant("generics.error try again");
        if (res.result) {
            switch (res.result) {
                case 'blocked':
                    msgError = this.translate.instant("land.errorLocation");
                    this.showError(msgError, null);
                    this.callingOpenai = false;
                    break;
                case 'error':
                    msgError = this.translate.instant("generics.error try again");
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
        console.log(err)
        if (err.error.error) {
            if (err.error.error.code == 'content_filter') {
                let msgError = this.translate.instant("generics.sorry cant anwser1");
                this.showError(msgError, err);
                this.callingOpenai = false;
            } else {
                let msgError = this.translate.instant("generics.error try again");
                this.showError(msgError, err);
                this.callingOpenai = false;
            }
        } else if (err.error.type == 'invalid_request_error') {
            if (err.error.code == 'string_above_max_length') {
                this.lauchEvent("error max tokens: "+this.medicalTextOriginal.length);
                let msgError = this.translate.instant("generics.sorry cant anwser3");
                this.showError(msgError, err);
                this.callingOpenai = false;
            } else {
                let msgError = err.error.code + ': ' + err.error.message;
                this.showError(msgError, err);
                this.callingOpenai = false;
            }
        } else {
            let msgError = '';
            if(err.error.message){
                if(err.error.message=='Invalid request format or content'){
                    msgError = this.translate.instant("generics.Invalid request format or content");
                }else if(err.error.message=='Translation error'){
                    msgError = this.translate.instant("generics.Translation error");
                }else{
                    msgError = this.translate.instant("generics.error try again");
                }
            }else{
                msgError = this.translate.instant("generics.error try again");
            }
            this.showError(msgError, err);
            this.callingOpenai = false;
        }
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
                <br> <em class="fa fa-check success mr-1"></em>${this.translate.instant("diagnosis.Matching symptoms")}: ${matchingSymptoms}
                <br> <em class="fa fa-times danger mr-1"></em>${this.translate.instant("diagnosis.Non-matching symptoms")}: ${nonMatchingSymptoms}
            `;
            this.topRelatedConditions.push({ content, name: disease.diagnosis, url: sponsor?.url || '', description: disease.description, matchingSymptoms: matchingSymptoms, nonMatchingSymptoms: nonMatchingSymptoms });
        });

        this.loadMoreDiseases = false;
        if (this.currentStep == 1) {
            this.currentStep = 2;
        }
        this.callingOpenai = false;
        Swal.close();
        //window.scrollTo(0, 0);
        this.lauchEvent("Search Disease");
        await this.delay(200);
        this.scrollTo();
        if (localStorage.getItem('sentFeedbackDxGPT') == null) {
            localStorage.setItem('sentFeedbackDxGPT', 'true')
        } else {
            if (localStorage.getItem('showFeedbackDxGPT') == null || localStorage.getItem('showFeedbackDxGPT') != 'true') {
                if (this.feedbackTimestampDxGPT === null || parseInt(this.feedbackTimestampDxGPT) < this.threeMonthsAgo) {
                    localStorage.setItem('sentFeedbackDxGPT', 'true')
                }
            }
        }
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
        this.continuePreparingCallOpenAi('step3');
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

        var value = { questionType: index, disease: selectedDiseaseEn, medicalDescription: this.medicalTextEng,myuuid: this.myuuid, operation: 'info disease', lang: this.lang, timezone: this.timezone, ip: this.ip, detectedLang: this.detectedLang }
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
                if(err.error.message){
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

    changeSymptom(event, index) {
        console.log(event);
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
            this.preparingCallOpenAi('step4'); 
        } else {
            this.preparingCallOpenAi('step4');
        }
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
            finalReport = this.translate.instant("diagnosis.Proposed diagnoses") + ":\n" + infoDiseases;
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

        var value = { value: this.symtpmsLabel + " " + this.medicalTextOriginal + " Call Text: " + this.medicalTextEng, myuuid: this.myuuid, operation: 'vote', lang: this.lang, vote: valueVote, topRelatedConditions: this.topRelatedConditions }
        this.subscription.add(this.apiDx29ServerService.opinion(value)
            .subscribe((res: any) => {
                this.lauchEvent("Vote: " + valueVote);
                this.sendingVote = false;
                if (valueVote == 'down') {
                    this.modalReference = this.modalService.open(contentFeedbackDown);
                } else {
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

        var value = { email: this.feedBack2input, myuuid: this.myuuid, lang: this.lang, info: this.feedBack1input, value: this.symtpmsLabel + " " + this.medicalTextOriginal + " Call Text: " + this.medicalTextEng, topRelatedConditions: this.topRelatedConditions, subscribe: this.checkSubscribe }
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

    countWords(text) {
        text = text.trim();
        if (text === '') {
          return 0;
        }
        return text.split(/\s+/).length;
      }

    resizeTextArea() {
        this.resizeTextAreaFunc(this.textAreas);
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
                            html: `<p>${detectePer}</p><p>${procDelete}</p><br><br><input type="checkbox" id="dont-show-again" class="mr-1">${msgcheck}`,
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
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 10 + 'px';
      }

    async checkText(step) {
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
            let words = this.countWords(this.editmedicalText);
            if(words>3000){
                let excessWords = words - 3000;
                let errorMessage = this.translate.instant("generics.exceedingWords", {
                    excessWords: excessWords
                });
                Swal.fire({
                    icon: 'error',
                    html: errorMessage,
                    showCancelButton: false,
                    showConfirmButton: true,
                    allowOutsideClick: false
                    });
                this.insightsService.trackEvent(errorMessage);
                return;
            }
            this.closeModal();
            this.medicalTextOriginal = this.editmedicalText;
            this.preparingCallOpenAi(step);
        }
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
}