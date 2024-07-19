import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ViewChildren, QueryList, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs/Subscription';
import { EventsService } from 'app/shared/services/events.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { SearchService } from 'app/shared/services/search.service';
import { Clipboard } from "@angular/cdk/clipboard"
import { v4 as uuidv4 } from 'uuid';
import { jsPDFService } from 'app/shared/services/jsPDF.service'
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { Observable } from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { prompts } from 'assets/js/prompts';


declare let gtag: any;

@Component({
    selector: 'app-undiagnosed-page',
    templateUrl: './undiagnosed-page.component.html',
    styleUrls: ['./undiagnosed-page.component.scss'],
    providers: [ApiDx29ServerService, jsPDFService],
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
    originalLang: string = 'en';
    detectedLang: string = 'en';
    selectedInfoDiseaseIndex: number = -1;
    minSymptoms: number = 2;
    _startTime: any;



    myuuid: string = uuidv4();
    eventList: any = [];
    steps = [];
    currentStep: any = {};
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
    optionRare: string = '';
    optionCommon: string = '';
    symtpmsLabel: string = '';
    feedBack1input: string = '';
    feedBack2input: string = '';
    sending: boolean = false;
    symptomsDifferencial: any = [];
    callingTextAnalytics: boolean = false;
    resTextAnalyticsSegments: any;
    langToExtract: string = '';
    parserObject: any = { parserStrategy: 'Auto', callingParser: false, file: undefined };
    langDetected: string = '';
    selectedQuestion: string = '';
    closed = false;
    email: string = '';
    msgfeedBack: string = '';
    checkSubscribe: boolean = false;
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
    @ViewChildren('autoajustable2') textAreas2: QueryList<ElementRef>;
    @ViewChild("autoajustable") inputTextAreaElement: ElementRef;

    constructor(private http: HttpClient, public translate: TranslateService, private searchService: SearchService, public toastr: ToastrService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private eventsService: EventsService, public jsPDFService: jsPDFService, public insightsService: InsightsService, private renderer: Renderer2, private route: ActivatedRoute) {
        if (sessionStorage.getItem('lang') == null) {
            sessionStorage.setItem('lang', this.translate.store.currentLang);
        }
        this.lang = sessionStorage.getItem('lang');
        this.originalLang = sessionStorage.getItem('lang');

        this._startTime = Date.now();

        if (sessionStorage.getItem('uuid') != null) {
            this.myuuid = sessionStorage.getItem('uuid');
        } else {
            this.myuuid = uuidv4();
            sessionStorage.setItem('uuid', this.myuuid);
        }
        this.lauchEvent("Init Page");
        
        this.steps = [
            { stepIndex: 1, isComplete: false, title: this.translate.instant("land.step1") },
            { stepIndex: 2, isComplete: false, title: this.translate.instant("land.step3") }
        ];
        this.currentStep = this.steps[0];

        this.loadSponsors();
        this.loadingIP();
    }

    loadingIP() {

        this.subscription.add(this.apiDx29ServerService.getInfoLocation()
            .subscribe((res: any) => {
                console.log(res)
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

    initQuestions() {
        this.questions = [
            { id: 1, question: this.translate.instant("land.q1") },
            { id: 2, question: this.translate.instant("land.q2") },
            { id: 3, question: this.translate.instant("land.q3") },
            { id: 4, question: this.translate.instant("land.q4") },
            { id: 5, question: this.translate.instant("land.q5") },
        ];
    }

    initOptions() {
        this.options = { id: 1, value: this.translate.instant("land.option1"), label: this.translate.instant("land.labelopt1"), description: this.translate.instant("land.descriptionopt1") };
    }

    onSubmitRevolution() {
        this.sending = true;
        var params = { email: this.email, description: this.msgfeedBack, lang: sessionStorage.getItem('lang'), subscribe: this.checkSubscribe };
        this.subscription.add(this.http.post(environment.serverapi + '/api/subscribe/', params)
            .subscribe((res: any) => {
                this.lauchEvent('Submit Revolution');
                this.sending = false;
                this.msgfeedBack = '';
                this.email = '';
                this.checkSubscribe = false;
                this.modalReference.close();
                Swal.fire({
                    icon: 'success',
                    html: this.translate.instant("land.Thank you"),
                    showCancelButton: false,
                    showConfirmButton: false,
                    allowOutsideClick: false
                })
                setTimeout(function () {
                    Swal.close();
                }, 2000);
            }, (err) => {
                this.insightsService.trackException(err);
                console.log(err);
                this.sending = false;
                this.checkSubscribe = false;
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }));

    }

    closeSupport() {
        this.msgfeedBack = '';
        this.email = '';
        this.checkSubscribe = false;
        this.modalReference.close();
    }


    async goPrevious() {
        this.topRelatedConditions = [];
        this.currentStep = this.steps[0];
        await this.delay(200);
        document.getElementById('optioninput1').scrollIntoView({ behavior: "smooth" });
        this.clearText();
    }

    async newPatient() {
        this.medicalTextOriginal = '';
        this.goPrevious();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
            return false;
        } else {
            return true;
        }
    }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        //traquear
        var secs = this.getElapsedSeconds();
        var savedEvent = this.searchService.search(this.eventList, 'name', category);
        if (category == "Info Disease") {
            var subcate = 'Info Disease - ' + this.selectedDisease;
            this.eventList.push({ name: subcate });
            gtag('event', subcate, { 'myuuid': this.myuuid, 'event_label': secs });
            subcate = 'Info quest - ' + this.selectedDisease + ' - ' + this.selectedQuestion
            gtag('event', subcate, { 'myuuid': this.myuuid, 'event_label': secs });

        }
        if (!savedEvent) {
            this.eventList.push({ name: category });
            gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
        }
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['medicalText']) {
                this.medicalTextOriginal = params['medicalText'];
            }
        });
        this.loadTranslations();
        this.eventsService.on('changelang', function (lang) {
            this.lang = lang;
            this.loadTranslations();
            if (this.currentStep.stepIndex == 2 && this.originalLang != lang) {
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
                        this.currentStep = this.steps[0];
                    }
                });
            }
        }.bind(this));

        this.eventsService.on('backEvent', function (event) {
            if (this.currentStep.stepIndex == 2) {
                this.goPrevious();
            }
        }.bind(this));
    }

    loadTranslations() {
        this.translate.get('land.step1').subscribe((res: string) => {
            this.steps[0].title = res;
        });
        this.translate.get('land.step3').subscribe(async (res: string) => {
            this.steps[1].title = res;
            await this.delay(500);
            this.initQuestions();
            this.initOptions()
        });

        this.translate.get('land.rare').subscribe((res: string) => {
            this.optionRare = res;
        });
        this.translate.get('land.common').subscribe((res: string) => {
            this.optionCommon = res;
        });
        this.translate.get('land.Symptoms').subscribe((res: string) => {
            this.symtpmsLabel = res;
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
        document.getElementById('optioninput1').scrollIntoView({ behavior: "smooth" });
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
            Swal.fire({
                icon: 'error',
                text: text,
                showCancelButton: false,
                showConfirmButton: true,
                allowOutsideClick: false
            })
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
                allowOutsideClick: false
            }).then((result) => {

            });
            var testLangText = this.medicalTextEng.substr(0, 4000)
            if (testLangText.length > 0) {
                this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
                    .subscribe((res: any) => {
                        if (res[0].language != 'en') {
                            this.detectedLang = res[0].language;
                            var info = [{ "Text": this.medicalTextEng }]
                            this.subscription.add(this.apiDx29ServerService.getTranslationDictionary(res[0].language, info)
                                .subscribe((res2: any) => {
                                    var textToTA = this.medicalTextEng.replace(/\n/g, " ");
                                    if (res2[0] != undefined) {
                                        if (res2[0].translations[0] != undefined) {
                                            textToTA = res2[0].translations[0].text;
                                        }
                                    }
                                    this.medicalTextEng = textToTA;
                                    this.callOpenAi();
                                }, (err) => {
                                    this.insightsService.trackException(err);
                                    console.log(err);
                                    this.callOpenAi();
                                }));
                        } else {
                            this.detectedLang = 'en';
                            this.callOpenAi();
                        }

                    }, (err) => {
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.toastr.error('', this.translate.instant("generics.error try again"));
                        this.callingOpenai = false;
                        Swal.close();
                    }));
            } else {
                this.callOpenAi();
            }
        }

    }

    callOpenAi() {
        Swal.close();
        Swal.fire({
            html: '<p>' + this.translate.instant("land.swal") + '</p>' + '<p>' + this.translate.instant("land.swal2") + '</p>' + '<p><em class="primary fa fa-spinner fa-2x fa-spin fa-fw"></em></p>',
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: this.translate.instant("generics.Cancel"),
            allowOutsideClick: false
        }).then(function (event) {
            if (event.dismiss == Swal.DismissReason.cancel) {
                this.callingOpenai = false;
                this.subscription.unsubscribe();
                this.subscription = new Subscription();
            }

        }.bind(this));

        this.callingOpenai = true;
        let introText = prompts.prompt1

        var value = { value: introText.replace("{{description}}", this.medicalTextEng), myuuid: this.myuuid, operation: 'find disease', lang: this.lang, ip: this.ip, timezone: this.timezone }
        let introText2 = prompts.prompt2
        if (this.loadMoreDiseases) {
            value = { value: introText2.replace("{{description}}", this.medicalTextEng).replace("{{diseases_list}}", this.diseaseListText), myuuid: this.myuuid, operation: 'find disease', lang: this.lang, ip: this.ip, timezone: this.timezone }
        }
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                if(res.result){
                    if(res.result == 'blocked'){
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("land.errorLocation"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                        this.callingOpenai = false;
                    }else if(res.result == 'error'){
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("generics.error try again"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                        this.callingOpenai = false;
                    }else if(res.result == 'error openai'){
                        Swal.close();
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("generics.sorry cant anwser1"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                        this.callingOpenai = false;
                    }else if(res.result == 'success'){
                        //if (this.currentStep.stepIndex == 1) {
                            this.copyMedicalText = this.medicalTextEng;
                        //}
                        this.callAnonymize(value, res.data);//parseChoices0
                        let parseChoices0 = res.data;
                        console.log(parseChoices0)
                        if (!this.loadMoreDiseases) {
                            this.diseaseListEn = [];
                        }
                        this.setDiseaseListEn(parseChoices0);
                        if (this.detectedLang != 'en') {
                            var jsontestLangText = this.createTranslationRequests(parseChoices0);
                            this.subscription.add(this.apiDx29ServerService.getSegmentation(this.detectedLang, jsontestLangText)
                                .subscribe((res2: any) => {
                                    if (res2 && res2.length > 0) {
                                        let index = 0;
                                        parseChoices0.forEach(disease => {
                                            let diagnosisTranslation = res2[index++]?.translations[0]?.text || disease.diagnosis;
                                            let descriptionTranslation = res2[index++]?.translations[0]?.text || disease.description;
                                            let symptomsInCommonTranslation = res2[index++]?.translations[0]?.text || disease.symptoms_in_common.join('; ');
                                            let symptomsNotInCommonTranslation = res2[index++]?.translations[0]?.text || disease.symptoms_not_in_common.join('; ');
                            
                                            disease.diagnosis = diagnosisTranslation;
                                            disease.description = descriptionTranslation;
                                            disease.symptoms_in_common = symptomsInCommonTranslation.split('; ').filter(symptom => symptom.trim() !== '');
                                            disease.symptoms_not_in_common = symptomsNotInCommonTranslation.split('; ').filter(symptom => symptom.trim() !== '');
                                        });
                                    }
                                    this.continueCallOpenAi(parseChoices0);
                                }, (err) => {
                                    this.insightsService.trackException(err);
                                    console.log(err);
                                    this.continueCallOpenAi(parseChoices0);
                                }));
                        } else {
                            this.continueCallOpenAi(parseChoices0);
                        }
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        text: this.translate.instant("generics.error try again"),
                        showCancelButton: false,
                        showConfirmButton: true,
                        allowOutsideClick: false
                    })
                    this.callingOpenai = false;
                }



            }, (err) => {
                console.log(err)
                if (err.error.error) {
                    if (err.error.error.code == 'content_filter') {
                        Swal.close();
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("generics.sorry cant anwser1"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                        this.callingOpenai = false;
                    } else {
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.callingOpenai = false;
                        Swal.close();
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("generics.error try again"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                    }


                } else if (err.error.type == 'invalid_request_error') {
                    if (err.error.code == 'context_length_exceeded') {
                        Swal.close();
                        Swal.fire({
                            icon: 'error',
                            html: this.translate.instant("generics.sorry cant anwser3") + '<a href="https://platform.openai.com/tokenizer" class="ml-1 danger" target="_blank">Tokenizer</a>',
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                        this.callingOpenai = false;
                    } else {
                        Swal.close();
                        Swal.fire({
                            icon: 'error',
                            title: err.error.code,
                            text: err.error.message,
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                        this.callingOpenai = false;
                    }

                } else {
                    this.insightsService.trackException(err);
                    console.log(err);
                    this.callingOpenai = false;
                    Swal.close();
                    Swal.fire({
                        icon: 'error',
                        text: this.translate.instant("generics.error try again"),
                        showCancelButton: false,
                        showConfirmButton: true,
                        allowOutsideClick: false
                    })
                }

            }));

    }

    includesElement(array, string) {
        string = string.toLowerCase();
        for (let i = 0; i < array.length; i++) {
            array[i] = array[i].toLowerCase();
            if (string.includes(array[i])) {
                return true;
            }
        }
        return false;
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

        let indexDisease = this.topRelatedConditions.length;
        for (let i = 0; i < parseChoices.length; i++) {
            let hasSponsor = false;
                let url = '';
                for (let j = 0; j < this.sponsors.length && !hasSponsor; j++) {
                    hasSponsor = this.includesElement(this.sponsors[j].synonyms, parseChoices[i].diagnosis)
                    if (hasSponsor) {
                        url = this.sponsors[j].url;
                    }
                }
            indexDisease++;
            console.log(parseChoices[i])
            let content = '<strong>' + (indexDisease) + '. ' + parseChoices[i].diagnosis + ':</strong> ' + parseChoices[i].description;
            if(parseChoices[i].symptoms_in_common.length > 0){
                content = content + '<br>' + this.translate.instant("diagnosis.Matching symptoms") + ': ' + parseChoices[i].symptoms_in_common.join(', ');
            }else{
                content = content + '<br>' + this.translate.instant("diagnosis.Matching symptoms") + ': ' + this.translate.instant("diagnosis.None");
            }
            if(parseChoices[i].symptoms_not_in_common.length > 0){
                content = content + '<br>' + this.translate.instant("diagnosis.Non-matching symptoms") + ': ' + parseChoices[i].symptoms_not_in_common.join(', ');
            }else{
                content = content + '<br>' + this.translate.instant("diagnosis.Non-matching symptoms") + ': ' + this.translate.instant("diagnosis.None");
            }
            
            this.topRelatedConditions.push({ 
                content: content, 
                name: parseChoices[i].diagnosis,  
                url: url 
            })
        }

        this.loadMoreDiseases = false;
        if (this.currentStep.stepIndex == 1) {
            this.currentStep = this.steps[1];
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
        for (let i = 0; i < text.length; i++) {
            if (text[i].diagnosis && text[i].diagnosis.length > 3) {
                this.diseaseListEn.push(text[i].diagnosis);
            }
        }
    }

    loadMore() {
        var diseases = '';
        for (let i = 0; i < this.diseaseListEn.length; i++) {
            diseases = diseases + '+' + this.diseaseListEn[i] + ', ';
        }
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
        var introText = question.question + ' ' + selectedDiseaseEn + '?';
        let infoOptionEvent = '';

        //var answerFormat = 'The output should be as HTML but only with <H5> and <p> tags.';
        var answerFormat = 'The output should be as HTML but only with <p>, <li>, </ul>, and <span> tags. Use <strong> for titles';
        //var answerFormat = '. The output should be as HTML but dont use h1, h2, h3, h4, h5, h6, <!DOCTYPE html>, html, head, body, input, form tags. use strong for titles';
        if (index == 0) {
            introText = 'What are the common symptoms associated with' + selectedDiseaseEn + '? Please provide a list starting with the most probable symptoms at the top. '+answerFormat;
            infoOptionEvent = 'Common Symptoms';
        }
        if (index == 1) {
            introText = 'Can you provide detailed information about ' + selectedDiseaseEn + ' ? I am a doctor. '+answerFormat;
            infoOptionEvent = 'Detailed Information';
        }
        if (index == 2) {
            introText = 'Provide a diagnosis test for' + selectedDiseaseEn+'. '+answerFormat;
            infoOptionEvent = 'Diagnosis Test';
        }
        if (index == 3) {
            introText = 'Given the medical description: ' + this.medicalTextEng + '. , what are the potential symptoms not present in the patient that could help in making a differential diagnosis for ' + selectedDiseaseEn + '. Please provide only a list, starting with the most likely symptoms at the top.';
            infoOptionEvent = 'Differential Diagnosis';
        }
        if (index == 4) {
            //introText = 'Based on the medical description: '+this.medicalTextEng+', why do you believe the patient has '+selectedDiseaseEn + '. Please indicate the symptoms common with '+selectedDiseaseEn + ' Indicate the common symptoms with '+selectedDiseaseEn +' and those the patient does not have.';
            introText = this.medicalTextEng + '. Why do you think this patient has ' + selectedDiseaseEn + '. Indicate the common symptoms with ' + selectedDiseaseEn + ' and the ones that he/she does not have. '+answerFormat;
            infoOptionEvent = 'Why Diagnosis';
        }

        this.lauchEvent(infoOptionEvent);
        var value = { value: introText, myuuid: this.myuuid, operation: 'info disease', lang: this.lang, timezone: this.timezone, ip: this.ip }
        this.subscription.add(this.apiDx29ServerService.callopenaiquestions(value)
            .subscribe((res: any) => {
                if(res.result){
                    if(res.result == 'blocked'){
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("land.errorLocation"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                    }else if(res.result == 'error'){
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("generics.error try again"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                    }else if(res.result == 'error openai'){
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("generics.sorry cant anwser1"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                    }else if(res.result == 'success'){
                        res.data = res.data.replace(/^```html\n|\n```$/g, '');
                        let content = res.data;
                        let splitChar = content.indexOf("\n\n") >= 0 ? "\n\n" : "\n";
                        let contentArray = content.split(splitChar);

                        // Encuentra el índice del primer punto "1."
                        let startIndex = contentArray.findIndex(item => item.trim().startsWith("1."));

                        // Si se encuentra el punto "1.", conserva todos los elementos a partir de ese índice
                        if (startIndex >= 0) {
                            contentArray = contentArray.slice(startIndex);
                        }

                        // Reconstruye el contenido
                        let parseChoices0 = contentArray.join(splitChar);
                        if (index == 3) {
                            if (this.detectedLang != 'en') {
                                var jsontestLangText = [{ "Text": parseChoices0[0] }]
                                if (parseChoices0.length > 1 && Array.isArray(parseChoices0)) {
                                    var sendInfo = '';
                                    for (let i = 0; i < parseChoices0.length; i++) {
                                        sendInfo = sendInfo + parseChoices0[i] + '\n';
                                    }
                                    jsontestLangText = [{ "Text": sendInfo }]
                                }
                                if (!Array.isArray(parseChoices0)) {
                                    jsontestLangText = [{ "Text": parseChoices0 }]
                                }

                                this.subscription.add(this.apiDx29ServerService.getSegmentation(this.detectedLang, jsontestLangText)
                                    .subscribe((res2: any) => {
                                        if (res2[0] != undefined) {
                                            if (res2[0].translations[0] != undefined) {
                                                parseChoices0 = res2[0].translations[0].text;
                                                if (parseChoices0.indexOf("1") == 0) {
                                                    parseChoices0 = "\n" + parseChoices0;
                                                }
                                            }
                                        }
                                        this.getDifferentialDiagnosis(parseChoices0);
                                        this.loadingAnswerOpenai = false;
                                        this.lauchEvent("Info Disease");
                                    }, (err) => {
                                        this.insightsService.trackException(err);
                                        console.log(err);
                                        this.getDifferentialDiagnosis(res.data);
                                        this.loadingAnswerOpenai = false;
                                        this.lauchEvent("Info Disease");
                                    }));
                            } else {
                                this.getDifferentialDiagnosis(res.data);
                                this.loadingAnswerOpenai = false;
                                this.lauchEvent("Info Disease");
                            }
                        } else {
                            var tempInfo = res.data;
                            if (parseChoices0.length > 1 && Array.isArray(parseChoices0)) {
                                var sendInfo = '';
                                for (let i = 0; i < parseChoices0.length; i++) {
                                    sendInfo = sendInfo + parseChoices0[i] + '\n';
                                }
                                tempInfo = sendInfo;
                            } else if (parseChoices0.length == 1) {
                                tempInfo = parseChoices0[0]
                            }
                            if(this.detectedLang != 'en'){
                                var info = [{ "Text": tempInfo }]
                                this.subscription.add(this.apiDx29ServerService.getTranslationInvert(this.detectedLang, info)
                                    .subscribe((res2: any) => {
                                        var textToTA = tempInfo;
                                        if (res2[0] != undefined) {
                                            if (res2[0].translations[0] != undefined) {
                                                textToTA = res2[0].translations[0].text;
                                            }
                                        }
                                        this.answerOpenai = textToTA;

                                        this.loadingAnswerOpenai = false;
                                        this.lauchEvent("Info Disease");
                                    }, (err) => {
                                        this.insightsService.trackException(err);
                                        console.log(err);
                                        if (parseChoices0.length > 1 && Array.isArray(parseChoices0)) {
                                            var sendInfo = '';
                                            for (let i = 0; i < parseChoices0.length; i++) {
                                                sendInfo = sendInfo + parseChoices0[i] + '\n';
                                            }
                                            this.answerOpenai = sendInfo;
                                        } else if (parseChoices0.length == 1) {
                                            this.answerOpenai = parseChoices0[0]
                                        } else {
                                            this.answerOpenai = res.data;
                                        }

                                        this.loadingAnswerOpenai = false;
                                        this.lauchEvent("Info Disease");
                                    }));
                            }else{
                                this.answerOpenai = tempInfo;

                                this.loadingAnswerOpenai = false;
                                this.lauchEvent("Info Disease");
                            }
                        }
                    }
                }else {
                    Swal.fire({
                        icon: 'error',
                        text: this.translate.instant("generics.sorry cant anwser2"),
                        showCancelButton: false,
                        showConfirmButton: true,
                        allowOutsideClick: false
                    })
                    this.loadingAnswerOpenai = false;
                }

            }, (err) => {
                this.insightsService.trackException(err);
                console.log(err);
                this.loadingAnswerOpenai = false;
            }));

    }

    getDifferentialDiagnosis(info) {
        var parseChoices = info.split("\n");
        this.symptomsDifferencial = [];
        for (let i = 0; i < parseChoices.length; i++) {
            if (parseChoices[i] != '' && parseChoices[i] != ' ' && parseChoices[i] != ':') {
                let index = parseChoices[i].indexOf('.');
                var name = parseChoices[i].split(".")[1];
                if (index != -1) {
                    name = parseChoices[i].substring(index + 1, parseChoices[i].length);
                }
                //if last char is a dot remove it
                if (name.charAt(name.length - 1) == '.') {
                    name = name.substring(0, name.length - 1);
                }
                //if last char is a space remove it
                if (name.charAt(name.length - 1) == ' ') {
                    name = name.substring(0, name.length - 1);
                }
                this.symptomsDifferencial.push({ name: name, checked: false })
            }
        }
    }

    changeSymptom(event, index) {
        console.log(event);
    }

    recalculateDifferencial() {
        var newSymptoms = '';
        for (let i = 0; i < this.symptomsDifferencial.length; i++) {
            if (this.symptomsDifferencial[i].checked) {
                newSymptoms = newSymptoms + this.symptomsDifferencial[i].name + ', ';
            }
        }
        //si el último elemento es un espacio, eliminarlo
        if (newSymptoms.charAt(newSymptoms.length - 1) == ' ') {
            newSymptoms = newSymptoms.substring(0, newSymptoms.length - 1);
        }
        // si es el último elemento, no añadir la coma
        if (newSymptoms.charAt(newSymptoms.length - 1) == ',') {
            newSymptoms = newSymptoms.substring(0, newSymptoms.length - 1);
        }
        if (newSymptoms != '') {
            this.lauchEvent("Recalculate Differencial");
            this.optionSelected = this.options;
            this.closeDiseaseUndiagnosed();

            this.differentialTextOriginal = newSymptoms;
            this.verifCallDifferential();
        } else {
            Swal.fire({
                icon: 'error',
                text: this.translate.instant("land.Select at least one symptom"),
                showCancelButton: false,
                showConfirmButton: true,
                allowOutsideClick: false
            })
        }

    }

    verifCallDifferential() {
        this.showErrorCall2 = false;
        if (this.callingOpenai || this.differentialTextOriginal.length == 0) {
            this.showErrorCall2 = true;
            let text = this.translate.instant("land.required");
            Swal.fire({
                icon: 'error',
                text: text,
                showCancelButton: false,
                showConfirmButton: true,
                allowOutsideClick: false
            })
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
                allowOutsideClick: false
            }).then((result) => {

            });
            if(this.detectedLang != 'en'){
                var info = [{ "Text": this.differentialTextOriginal }]
                this.subscription.add(this.apiDx29ServerService.getTranslationDictionary(this.detectedLang, info)
                    .subscribe((res2: any) => {
                        var textToTA = this.differentialTextOriginal.replace(/\n/g, " ");
                        if (res2[0] != undefined) {
                            if (res2[0].translations[0] != undefined) {
                                textToTA = res2[0].translations[0].text;
                            }
                        }
                        this.differentialTextTranslated = textToTA;
                        this.preparingCallOpenAi('step4');
                    }, (err) => {
                        this.differentialTextTranslated = this.differentialTextOriginal;
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.preparingCallOpenAi('step4');
                    }));
            }else{
                this.differentialTextTranslated = this.differentialTextOriginal;
                this.preparingCallOpenAi('step4'); 
            }
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
            backdrop: 'static',
            keyboard: false,
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
        Swal.fire({
            icon: 'success',
            html: this.translate.instant("land.Results copied to the clipboard"),
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        })
        setTimeout(function () {
            Swal.close();
        }, 2000);
        this.lauchEvent("Copy results");

    }

    getPlainInfoDiseases2() {
        var resCopy = "";
        for (let i = 0; i < this.topRelatedConditions.length; i++) {
            resCopy = resCopy + this.topRelatedConditions[i].name;
            if (i + 1 < this.topRelatedConditions.length) {
                resCopy = resCopy + "\n";
            }
        }
        return resCopy;
    }

    downloadResults() {
        if (!this.callingAnonymize) {
            let infoDiseases = this.getDiseaseInfo(this.topRelatedConditions);
            this.jsPDFService.generateResultsPDF(this.medicalTextOriginal, infoDiseases, this.lang)
            this.lauchEvent("Download results");
        }

    }

    getDiseaseInfo(diseases: any[]): { name: string, description: string }[] {
        return diseases.map(disease => {
            const matches = disease.content.match(/<\/strong>([\s\S]*?)(\n\n|$)/);
            const description = matches && matches[1].trim() || '';
            return {
                name: disease.name,
                description: description
            };
        });
    }

    getLiteral(literal) {
        return this.translate.instant(literal);
    }

    vote(valueVote, contentFeedbackDown) {
        this.sendingVote = true;
        let introText = prompts.prompt1

        var value = { value: introText + this.symtpmsLabel + " " + this.medicalTextOriginal + " Call Text: " + this.medicalTextEng, myuuid: this.myuuid, operation: 'vote', lang: this.lang, vote: valueVote, topRelatedConditions: this.topRelatedConditions }
        this.subscription.add(this.apiDx29ServerService.opinion(value)
            .subscribe((res: any) => {
                this.lauchEvent("Vote: " + valueVote);
                this.sendingVote = false;
                if (valueVote == 'down') {
                    this.modalReference = this.modalService.open(contentFeedbackDown);
                } else {
                    Swal.fire({
                        icon: 'success',
                        html: this.translate.instant("land.thanks"),
                        showCancelButton: false,
                        showConfirmButton: false,
                        allowOutsideClick: false
                    })
                    setTimeout(function () {
                        Swal.close();
                    }, 2000);
                }

            }, (err) => {
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
        let introText = prompts.prompt1

        var value = { email: this.feedBack2input, myuuid: this.myuuid, lang: this.lang, info: this.feedBack1input, value: introText + this.symtpmsLabel + " " + this.medicalTextOriginal + " Call Text: " + this.medicalTextEng, topRelatedConditions: this.topRelatedConditions, subscribe: this.checkSubscribe }
        this.subscription.add(this.apiDx29ServerService.feedback(value)
            .subscribe((res: any) => {
                this.lauchEvent("Feedback");
                this.sending = false;
                this.feedBack1input = '';
                this.feedBack2input = '';
                this.checkSubscribe = false;
                if (this.modalReference != undefined) {
                    this.modalReference.close();
                    this.modalReference = undefined;
                }

                Swal.fire({
                    icon: 'success',
                    html: this.translate.instant("land.thanks"),
                    showCancelButton: false,
                    showConfirmButton: false,
                    allowOutsideClick: false
                })
                setTimeout(function () {
                    Swal.close();
                }, 2000);
            }, (err) => {
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
        Swal.fire({
            icon: 'success',
            html: this.translate.instant("land.thanks"),
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        })
        setTimeout(function () {
            Swal.close();
        }, 2000);
    }


    resizeTextArea() {
        this.resizeTextAreaFunc(this.textAreas);
    }

    private resizeTextAreaFunc(elements: QueryList<ElementRef>) {
        elements.forEach((element: ElementRef) => {
            const nativeElement = element.nativeElement;
            this.renderer.listen(nativeElement, 'input', () => {
                let height = nativeElement.scrollHeight;
                if (height < 50) height = 50;
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

    callAnonymize(value, response) {
        this.callingAnonymize = true;
        this.hasAnonymize = false;
        this.resultAnonymized = '';
        this.copyResultAnonymized = '';
        var info = { value: this.medicalTextOriginal, myuuid: value.myuuid, operation: value.operation, lang: this.lang, response: response, topRelatedConditions: this.topRelatedConditions, timezone: this.timezone, ip: this.ip }
        this.subscription.add(this.apiDx29ServerService.postAnonymize(info)
            .subscribe((res: any) => {
                if(res.result){
                    if(res.result == 'blocked'){
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("land.errorLocation"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                    }
                    this.callingAnonymize = false;
                    this.hasAnonymize = true;
                }else{
                    let parseChoices = res.choices[0].message.content;
                    //parseChoices = parseChoices.replace(/^"""\s*\n/, '').replace(/\s*"""\s*$/, '');
                    parseChoices = parseChoices.replace(/^\s*"""\s*/, '').replace(/\s*"""\s*$/, '');
                    let parts = parseChoices.split(/(\[ANON-\d+\])/g);
                    let partsCopy = parseChoices.split(/(\[ANON-\d+\])/g);

                    if (parts.length > 1) {
                        for (let i = 0; i < parts.length; i++) {
                            if (/\[ANON-\d+\]/.test(parts[i])) {
                                let length = parseInt(parts[i].match(/\d+/)[0]);
                                let blackSpan = '<span style="background-color: black; display: inline-block; width:' + length + 'em;">&nbsp;</span>';
                                parts[i] = blackSpan;
                                // Agregamos la parte de los asteriscos
                                let asterisks = '*'.repeat(length);
                                partsCopy[i] = asterisks;
                            }
                        }
                        this.resultAnonymized = parts.join('');
                        this.resultAnonymized = this.resultAnonymized.replace(/\n/g, '<br>');

                        this.copyResultAnonymized = partsCopy.join('');
                        this.copyResultAnonymized = this.copyResultAnonymized.replace(/\n/g, '<br>');
                        this.medicalTextOriginal = this.copyResultAnonymized;
                        this.medicalTextEng = this.copyResultAnonymized;
                        this.callingAnonymize = false;
                        this.hasAnonymize = true;

                        if (!localStorage.getItem('dontShowSwal')) {
                            let detectePer = this.translate.instant("diagnosis.detected personal information");
                            let procDelete = this.translate.instant("diagnosis.proceeded to delete");
                            let msgcheck = this.translate.instant("land.check");
                            Swal.fire({
                                icon: 'info',
                                html: '<p>' + detectePer + '</p><p>' + procDelete + '</p><br><br><input type="checkbox" id="dont-show-again" class="mr-1">' + msgcheck,
                                showCancelButton: false,
                                showConfirmButton: true,
                                allowOutsideClick: false
                            }).then((result) => {
                                if ((document.getElementById('dont-show-again') as HTMLInputElement).checked) {
                                    // Aquí puedes almacenar la preferencia del usuario, por ejemplo en localStorage
                                    localStorage.setItem('dontShowSwal', 'true');
                                }
                            });
                        } else {
                            this.mostrarFinalizacionAnonimizado(true);
                        }
                    } else {
                        this.callingAnonymize = false;
                        this.hasAnonymize = false;
                        this.mostrarFinalizacionAnonimizado(false);
                    }
                }
                

            }, (err) => {
                console.log(err);
                this.insightsService.trackException(err);
                this.callingAnonymize = false;
                this.hasAnonymize = false;
                this.mostrarFinalizacionAnonimizado(false);
            }));
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
        await this.delay(200);
        this.resizeTextArea();
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
            Swal.fire({
                icon: 'error',
                text: text,
                showCancelButton: false,
                showConfirmButton: true,
                allowOutsideClick: false
            })
        }
        if (!this.showErrorCall1) {
            this.closeModal();
            this.medicalTextOriginal = this.editmedicalText;
            this.preparingCallOpenAi(step);
        }
    }
}
