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


declare let gtag: any;

@Component({
    selector: 'app-undiagnosed-page',
    templateUrl: './undiagnosed-page.component.html',
    styleUrls: ['./undiagnosed-page.component.scss'],
    providers: [ApiDx29ServerService, jsPDFService],
})

export class UndiagnosedPageComponent implements OnInit, OnDestroy {

    private subscription: Subscription = new Subscription();
    medicalText: string = '';
    premedicalText: string = '';
    temppremedicalText: string = '';
    medicalText2: string = '';
    medicalText2Copy: string = '';
    copyMedicalText: string = '';
    modalReference: NgbModalRef;
    topRelatedConditions: any = [];
    diseaseListEn: any = [];
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
    showInputRecalculate: boolean = false;
    options: any = [];
    optionSelected: any = {};
    sendingVote: boolean = false;
    selectorRare: boolean = true;
    prevSelectorRare: boolean = true;
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
    feedbackTimestampDxGPT = localStorage.getItem('feedbackTimestampDxGPT');
    threeMonthsAgo = Date.now() - (3 * 30 * 24 * 60 * 60 * 1000); // 3 meses
    terms2: boolean = false;
    patientSymptoms: any = [];

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
        this.options = [
            { id: 1, value: this.translate.instant("land.option1"), label: this.translate.instant("land.labelopt1"), description: this.translate.instant("land.descriptionopt1") },
            { id: 2, value: this.translate.instant("land.option3"), label: this.translate.instant("land.labelopt3"), description: this.translate.instant("land.descriptionopt3") }
        ];
    }

    openSupport(content) {
        this.modalReference = this.modalService.open(content);
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
        this.showInputRecalculate = false;
        this.currentStep = this.steps[0];
        await this.delay(200);
        document.getElementById('optioninput1').scrollIntoView({ behavior: "smooth" });
        this.clearText();
    }

    async newPatient() {
        this.medicalText = '';
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
                this.medicalText = params['medicalText'];
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
                        //this.focusTextArea();
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
            this.medicalText = this.translate.instant("land.p1.1")
        } else {
            this.medicalText = this.translate.instant("land.p1.2")
        }
        document.getElementById('optioninput1').scrollIntoView({ behavior: "smooth" });
        this.resizeTextArea();
    }

    clearText() {
        this.medicalText2 = '';
        this.medicalText2Copy = '';
        this.showInputRecalculate = false;
        //this.medicalText = '';
        this.copyMedicalText = '';
        this.showErrorCall1 = false;
        document.getElementById("textarea1").setAttribute("style", "height:50px;overflow-y:hidden; width: 100%;");
        this.resizeTextArea();
    }

    async checkPopup(contentIntro) {
        this.showErrorCall1 = false;
        if (this.callingOpenai || this.medicalText.length < 15) {
            this.showErrorCall1 = true;
            let text = this.translate.instant("land.required");
            if (this.medicalText.length > 0) {
                text = this.translate.instant("land.requiredMIN5");
                let introText = this.translate.instant("land.charactersleft", {
                    value: (15 - this.medicalText.length)
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

    verifCallOpenAi(step) {
        this.showErrorCall1 = false;
        if (this.callingOpenai || this.medicalText.length < 15) {
            this.showErrorCall1 = true;
        }
        if (!this.showErrorCall1) {
            this.preparingCallOpenAi(step);
        }
    }


    preparingCallOpenAi(step) {
        this.callingOpenai = true;
        if (step == 'step3' || step == 'step4' || (step == 'step2' && this.showInputRecalculate && this.medicalText2.length > 0)) {
            if (this.optionSelected.id == 1) {
                var labelMoreSymptoms = this.translate.instant("land.msgmoresymptoms")
                if (this.medicalText.indexOf(labelMoreSymptoms) == -1) {
                    this.copyMedicalText = this.copyMedicalText + '. ' + this.optionSelected.value + ' ' + this.medicalText2Copy
                    this.premedicalText = this.copyMedicalText;
                    this.medicalText = this.medicalText + '. ' + labelMoreSymptoms + ' ' + this.medicalText2;

                } else {
                    this.copyMedicalText = this.copyMedicalText + ', ' + this.medicalText2Copy
                    this.premedicalText = this.copyMedicalText;
                    this.medicalText = this.medicalText + ', ' + this.medicalText2;
                }
            }else if(this.optionSelected.id == 2){
                var labeltest = this.translate.instant("land.msgtest")
                if (this.medicalText.indexOf(labeltest) == -1) {
                    this.copyMedicalText = this.copyMedicalText + '. ' + this.optionSelected.value + ' ' + this.medicalText2Copy
                    this.premedicalText = this.copyMedicalText;
                    this.medicalText = this.medicalText + '. ' + labeltest + ' ' + this.medicalText2;
                } else {
                    this.copyMedicalText = this.copyMedicalText + ', ' + this.medicalText2Copy
                    this.premedicalText = this.copyMedicalText;
                    this.medicalText = this.medicalText + ', ' + this.medicalText2;
                }
            } else {
                this.premedicalText = this.copyMedicalText + '. ' + this.optionSelected.value + ' ' + this.medicalText2Copy;
            }
        }else {
            this.premedicalText = this.medicalText;
        }
        this.medicalText2 = '';
        this.continuePreparingCallOpenAi(step);

        /*Swal.fire({
            icon: 'error',
            text: this.translate.instant("land.errorLocation"),
            showCancelButton: false,
            showConfirmButton: true,
            allowOutsideClick: false
        })*/


    }

    continuePreparingCallOpenAi(step) {
        if (step == 'step3' || step == 'step4' || (step == 'step2' && this.showInputRecalculate && this.medicalText2.length > 0)) {
            this.callOpenAi(step);
        } else {
            Swal.fire({
                title: this.translate.instant("generics.Please wait"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false
            }).then((result) => {

            });
            var testLangText = this.premedicalText.substr(0, 4000)
            if (testLangText.length > 0) {
                this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
                    .subscribe((res: any) => {
                        if (res[0].language != 'en') {
                            this.detectedLang = res[0].language;
                            var info = [{ "Text": this.premedicalText }]
                            this.subscription.add(this.apiDx29ServerService.getTranslationDictionary(res[0].language, info)
                                .subscribe((res2: any) => {
                                    var textToTA = this.premedicalText.replace(/\n/g, " ");
                                    if (res2[0] != undefined) {
                                        if (res2[0].translations[0] != undefined) {
                                            textToTA = res2[0].translations[0].text;
                                        }
                                    }
                                    this.premedicalText = textToTA;
                                    this.callOpenAi(step);
                                }, (err) => {
                                    this.insightsService.trackException(err);
                                    console.log(err);
                                    this.callOpenAi(step);
                                }));
                        } else {
                            this.detectedLang = 'en';
                            this.callOpenAi(step);
                        }

                    }, (err) => {
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.toastr.error('', this.translate.instant("generics.error try again"));
                        this.callingOpenai = false;
                        Swal.close();
                    }));
            } else {
                this.callOpenAi(step);
            }
        }

    }

    callOpenAi(step) {
        // call api POST openai
        Swal.close();
        Swal.fire({
            html: '<p>' + this.translate.instant("landv2.swal") + '</p>' + '<p>' + this.translate.instant("landv2.swal2") + '</p>' + '<p><em class="primary fa fa-spinner fa-2x fa-spin fa-fw"></em></p>',
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: this.translate.instant("generics.Cancel"),
            allowOutsideClick: false
        }).then(function (event) {
            if (event.dismiss == Swal.DismissReason.cancel) {

                // function when confirm button clicked
                this.callingOpenai = false;
                this.subscription.unsubscribe();
                this.subscription = new Subscription();
                if (step == 'step2') {
                    this.selectorRare = this.prevSelectorRare;
                    this.loadMoreDiseases = !this.loadMoreDiseases;
                }
            }

        }.bind(this));

        this.callingOpenai = true;
        let paramIntroText = this.optionRare;
        if (this.selectorRare) {
            paramIntroText = this.optionCommon;
        }
        /*let introText = this.translate.instant("land.prom1V2", {
            value: paramIntroText
        })*/

        let introText2 = `"Behave like a hypothetical doctor who has to diagnose a patient based on the provided symptoms. Provide a detailed analysis of one potential disease. Include the name of the disease, a brief description with a probability of diagnosis, and provide a concise bullet-point list of non-common symptoms. The non-common symptoms should be listed by their concise names only, without additional explanations or descriptions, for easy parsing.
        Disease Name: {{name of the disease}}
        Brief Description: {{short description of the disease with a probability of diagnosis (high, moderate, or low) and the reasoning}}
        Non-common Symptoms: {{concise bullet-point list of symptom names without descriptions, that are not present in the patient but are key identifiers for the disease}}
        Do not include any additional explanations or disclaimers beyond the requested information. Begin with the patient's description as follows.
        The patient's description is: \n'`;



        let introText = `"Act as a hypothetical doctor tasked with diagnosing a patient based on the provided symptoms. Provide a detailed analysis of one potential disease. Includes the disease name, a brief description with the probability of diagnosis, and a list of key identifier symptoms indicating their presence based on the patient's description.
        Disease Name: {{name of the disease}}
        Brief Description: {{short description of the disease with a probability of diagnosis (high, moderate, or low) and the reasoning}}
        Non-common Symptoms: {{list of symptom names without descriptions, that are key identifiers for the disease. If possible, give me the 12 most important key symptoms of the disease. For each symptom, indicate if it is present in the patient or not by adding a checkmark or an X}}
        Do not include any additional explanations or disclaimers beyond the requested information. Begin with the patient's description as follows.
        Please format the response in JSON:
        {
        "diseaseName": "{{name of the disease}}",
        "briefDescription": "{{brief description with probability of diagnosis}}",
        "nonCommonSymptoms": [
            {"name": "Symptom 1", "checked": true/false},
            {"name": "Symptom 2", "checked": true/false},
            ...
            {"name": "Symptom 12", "checked": true/false}
        ]
        }

        The patient's description is: \n'`;

        var value = { value: introText + " " + this.premedicalText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang, ip: this.ip }
        if (this.loadMoreDiseases) {
            value = { value: introText + " " + this.temppremedicalText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang, ip: this.ip }
        }
        if (step == 'step3') {
            var diseases = '';
            for (let i = 0; i < this.diseaseListEn.length; i++) {
                diseases = diseases + this.diseaseListEn[i] + ', ';
            }
            /*let introText2 = this.translate.instant("land.promt2V2", {
                value: diseases
            })*/

            let introText2 = `"Behave like a hypothetical doctor who has to diagnose a patient based on the provided symptoms. Continue analyzing and suggest another potential disease, ensuring not to repeat any from the provided list. Includes the disease name, a brief description with the probability of diagnosis, and a list of key identifier symptoms indicating their presence based on the patient's description.
            Previously diagnosed diseases: `+diseases+`
            Disease Name: {{name of the disease}}
            Brief Description: {{short description of the disease with a probability of diagnosis (high, moderate, or low) and the reasoning}}
            Non-common Symptoms: {{list of symptom names without descriptions, that are key identifiers for the disease. If possible, give me the 12 most important key symptoms of the disease. For each symptom, indicate if it is present in the patient or not by adding a checkmark or an X}}
            Do not include any additional explanations or disclaimers beyond the requested information. Begin with the patient's description as follows.
            Please format the response in JSON:
            {
            "diseaseName": "{{name of the disease}}",
            "briefDescription": "{{brief description with probability of diagnosis}}",
            "nonCommonSymptoms": [
                {"name": "Symptom 1", "checked": true/false},
                {"name": "Symptom 2", "checked": true/false},
                ...
                {"name": "Symptom 12", "checked": true/false}
            ]
            }
    
            The patient's description is: \n'`;
            value = { value: introText2 + " " + this.temppremedicalText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang, ip: this.ip }
        }
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                if (res.choices) {
                    if (res.choices[0].message.content) {
                        if (this.currentStep.stepIndex == 1 || step == 'step2') {
                            this.copyMedicalText = this.premedicalText;
                        }
                        this.callAnonymize(value, res.choices[0].message.content);//parseChoices0
                        let parseChoices0 = res.choices[0].message.content;

                            // Elimina comillas adicionales y deshazte de los caracteres de escape
                            parseChoices0 = parseChoices0.trim(); // Elimina espacios al inicio y final si los hay

                            if (parseChoices0.startsWith('"') && parseChoices0.endsWith('"')) {
                                parseChoices0 = parseChoices0.slice(1, -1); // Elimina comillas adicionales
                            }

                            // Reemplaza secuencias de escape
                            parseChoices0 = parseChoices0.replace(/\\n/g, "\n").replace(/\\"/g, '"');

                            try {
                                const jsonData = JSON.parse(parseChoices0);
                                console.log(jsonData); // Verifica que se haya parseado correctamente
                                if (!this.loadMoreDiseases) {
                                    this.diseaseListEn = [];
                                }
                                if (step == 'step2') {
                                    this.diseaseListEn = [];
                                    this.topRelatedConditions = [];
                                }
                                this.continueCallOpenAi(parseChoices0);

                            } catch (error) {
                                console.error("Error parsing JSON", error);
                            }
                        
                       
                    } else {
                        Swal.close();
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("generics.sorry cant anwser1"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                        this.callingOpenai = false;
                    }
                } else {
                    Swal.close();
                    Swal.fire({
                        icon: 'error',
                        text: this.translate.instant("generics.sorry cant anwser1"),
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

    async continueCallOpenAi(jsonInput) {
        // Asumimos que jsonInput es una cadena JSON, entonces primero la parseamos.
        const parsedData = JSON.parse(jsonInput);
    
        console.log(parsedData);  // Muestra los datos parseados en la consola para verificar
    
        // Si necesitas manejar la localización o cualquier otra transformación de datos, hazlo aquí.
        if (this.detectedLang != 'en') {
            var jsontestLangText = [{ "Text": parsedData.diseaseName }, { "Text": parsedData.briefDescription }, { "Text": parsedData.nonCommonSymptoms.map(symptom => symptom.name).join('\n')}];
            this.subscription.add(this.apiDx29ServerService.getSegmentation(this.detectedLang, jsontestLangText)
                .subscribe((res2: any) => {
                    console.log(res2);
                    if (res2[0] != undefined && res2[0].translations[0] != undefined) {
                        parsedData.diseaseName = res2[0].translations[0].text;
                    }
                    if (res2[1] != undefined && res2[1].translations[0] != undefined) {
                        parsedData.briefDescription = res2[1].translations[0].text;
                    }
                    if (res2[2] != undefined && res2[2].translations[0] != undefined) {
                        var symptoms = res2[2].translations[0].text.split('\n');
                        for (let i = 0; i < symptoms.length; i++) {
                            parsedData.nonCommonSymptoms[i].name = symptoms[i];
                        }
                    }
                    this.showResultDisease(parsedData);
                }, (err) => {
                    this.insightsService.trackException(err);
                    console.log(err);
                    this.showResultDisease(parsedData);
                }));
        } else {
            this.showResultDisease(parsedData);
        }
    }
    

    async showResultDisease(parsedData) {
        if (!this.loadMoreDiseases) {
            this.topRelatedConditions = [];
        }
        console.log(parsedData)
        this.setDiseaseListEn(parsedData.diseaseName);
        this.topRelatedConditions.push({ content: parsedData.briefDescription, name: parsedData.diseaseName, nonCommonSymptoms: parsedData.nonCommonSymptoms });
        this.showMoreInfoDiseasePopup(this.topRelatedConditions.length - 1);
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
        this.showInputRecalculate = false;
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

    addSymptom(symptomName: string): void {
        // Busca el síntoma en nonCommonSymptoms y lo marca como checked
        this.topRelatedConditions[this.selectedInfoDiseaseIndex].nonCommonSymptoms.forEach(symptom => {
            if (symptom.name === symptomName) {
                symptom.checked = true;
            }
        });
    
        //check if symptomName not exits in this.patientSymptoms, if not exits add it
        let found = false;
        for (let i = 0; i < this.patientSymptoms.length; i++) {
            if (this.patientSymptoms[i].name == symptomName) {
                found = true;
            }
        }
        if (!found) {
            this.patientSymptoms.push({ name: symptomName, checked: true });
        }
        
    }

    removeSymptom(symptomName: string): void {
        // Busca y actualiza el síntoma para desmarcarlo como 'checked'
        this.topRelatedConditions[this.selectedInfoDiseaseIndex].nonCommonSymptoms.forEach(symptom => {
            if (symptom.name === symptomName) {
                symptom.checked = false;
            }
        });

    
        //check if symptomName exits in this.patientSymptoms, if exits remove it
        let found = false;
        let index = -1;
        for (let i = 0; i < this.patientSymptoms.length; i++) {
            if (this.patientSymptoms[i].name == symptomName) {
                found = true;
                index = i;
            }
        }
        if (found) {
            this.patientSymptoms.splice(index, 1);
        }
        
    }

    changeSymptomDiff(event: any, index: number): void {
        // Obtener la referencia del síntoma que se ha cambiado.
        let symptom = this.topRelatedConditions[this.selectedInfoDiseaseIndex].nonCommonSymptoms[index];
    
        // Actualizar la propiedad checked según el evento.
        symptom.checked = event.checked;
    
        // Si el síntoma está marcado, añadirlo a la lista de síntomas del paciente si aún no está presente.
        if (symptom.checked) {
            if (!this.patientSymptoms.some(s => s.name === symptom.name)) {
                this.patientSymptoms.push({ name: symptom.name, checked: true });
            }
        } else {
            // Si el síntoma no está marcado, eliminarlo de la lista de síntomas del paciente.
            this.patientSymptoms = this.patientSymptoms.filter(s => s.name !== symptom.name);
        }
    }

      recalculatePrevDifferencial() {
        this.symptomsDifferencial = [];
        this.topRelatedConditions[this.selectedInfoDiseaseIndex].nonCommonSymptoms.forEach(symptom => {
            if (symptom.checked) {
                this.symptomsDifferencial.push(symptom);
            }
        });
        

        console.log(this.symptomsDifferencial)
        if(this.symptomsDifferencial.length > 0) {
            this.mergeDescriptionSymptoms();
            //this.recalculateDifferencial();
        }else{
            Swal.fire({
                icon: 'error',
                text: this.translate.instant("land.Select at least one symptom"),
                showCancelButton: false,
                showConfirmButton: true,
                allowOutsideClick: false
            })
        }
       
      }

      mergeDescriptionSymptoms() {
        Swal.close();
        Swal.fire({
            html: '<p>Se está actualizando la descripcion del paciente con los cambios marcados en los síntomas.</p>' + '<p><em class="primary fa fa-spinner fa-2x fa-spin fa-fw"></em></p>',
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: this.translate.instant("generics.Cancel"),
            allowOutsideClick: false
        }).then(function (event) {
            if (event.dismiss == Swal.DismissReason.cancel) {

                // function when confirm button clicked
                this.callingOpenai = false;
                this.subscription.unsubscribe();
                this.subscription = new Subscription();
            }

        }.bind(this));
        this.callingOpenai = true;
        //for each symptom in this.symptomsDifferencial, get name property and set to sintomas variable and separate by comma
        let sintomas = this.symptomsDifferencial.map(symptom => symptom.name).join(', ');
        let introText = `"Act as a hypothetical doctor tasked with revising and expanding a patient's medical description based on new symptoms checked. Start with the original patient description provided below, and seamlessly incorporate any new checked symptoms into this description without altering the original context or explicitly stating new additions.

        Original Patient Description:
        `+this.premedicalText+`

        Checked Symptoms:
        `+sintomas+`

        Integrate the checked symptoms into the original description as if they were part of the initial examination findings, ensuring a natural flow and avoiding phrases like 'additionally' or 'the patient also has'. The goal is to update the patient's description such that it includes all relevant symptoms in a cohesive narrative format. Please provide the revised patient description."`;

        var value = { value: introText + " " + this.premedicalText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang, ip: this.ip }
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                if (res.choices) {
                    console.log(res.choices[0].message.content)
                    if (res.choices[0].message.content) {
                        this.premedicalText = res.choices[0].message.content;
                        //translate to detectedLang
                        this.symptomsDifferencial = [];
                        if (this.detectedLang != 'en') {
                            var jsontestLangText = [{ "Text": this.premedicalText }]
                            this.subscription.add(this.apiDx29ServerService.getTranslationInvert(this.detectedLang, jsontestLangText)
                                .subscribe((res2: any) => {
                                    if (res2[0] != undefined && res2[0].translations[0] != undefined) {
                                        //this.premedicalText = res2[0].translations[0].text;
                                        this.medicalText = this.premedicalText;
                                    }
                                    this.callOpenAi('step2');
                                }, (err) => {
                                    this.insightsService.trackException(err);
                                    console.log(err);
                                    this.callOpenAi('step2');
                                }));
                        } else {
                            this.callOpenAi('step2');
                        }
                        
                    } else {
                        Swal.close();
                        Swal.fire({
                            icon: 'error',
                            text: this.translate.instant("generics.sorry cant anwser1"),
                            showCancelButton: false,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        })
                        this.callingOpenai = false;
                    }
                } else {
                    Swal.close();
                    Swal.fire({
                        icon: 'error',
                        text: this.translate.instant("generics.sorry cant anwser1"),
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



    showMoreInfoDiseasePopup(diseaseIndex) {
        this.answerOpenai = '';
        this.symptomsDifferencial = [];
        this.selectedInfoDiseaseIndex = diseaseIndex;
        var nameEvent = 'Undiagnosed - Select Disease - ' + this.topRelatedConditions[this.selectedInfoDiseaseIndex].name;
        this.lauchEvent(nameEvent);
        this.selectedDisease = this.topRelatedConditions[this.selectedInfoDiseaseIndex].name;
    }

    previousDisease() {
        if (this.selectedInfoDiseaseIndex > 0) {
            this.selectedInfoDiseaseIndex--;
            this.showMoreInfoDiseasePopup(this.selectedInfoDiseaseIndex);
        }
    }
    nextDisease() {
        if (this.selectedInfoDiseaseIndex < this.topRelatedConditions.length - 1) {
            this.selectedInfoDiseaseIndex++;
            this.showMoreInfoDiseasePopup(this.selectedInfoDiseaseIndex);
        }
    }

    cancelEdit() {
        this.showInputRecalculate = false;
        this.medicalText2 = '';
    }


    setDiseaseListEn(text) {
        this.diseaseListEn.push(text)
    }

    loadMore() {
        this.temppremedicalText = this.copyMedicalText;
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

    showQuestion(question, index, contentInfoDisease) {
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
        if (index == 0) {
            introText = 'What are the common symptoms associated with' + selectedDiseaseEn + '? Please provide a list starting with the most probable symptoms at the top.';
            infoOptionEvent = 'Common Symptoms';
        }
        if (index == 1) {
            introText = 'Can you provide detailed information about ' + selectedDiseaseEn + ' ? I am a doctor.';
            infoOptionEvent = 'Detailed Information';
        }
        if (index == 2) {
            introText = 'Provide a diagnosis test for' + selectedDiseaseEn;
            infoOptionEvent = 'Diagnosis Test';
        }
        if (index == 3) {
            introText = 'Given the medical description: ' + this.premedicalText + '. , what are the potential symptoms not present in the patient that could help in making a differential diagnosis for ' + selectedDiseaseEn + '. Please provide only a list, starting with the most likely symptoms at the top.';
            infoOptionEvent = 'Differential Diagnosis';
        }
        if (index == 4) {
            //introText = 'Based on the medical description: '+this.premedicalText+', why do you believe the patient has '+selectedDiseaseEn + '. Please indicate the symptoms common with '+selectedDiseaseEn + ' Indicate the common symptoms with '+selectedDiseaseEn +' and those the patient does not have.';
            introText = this.premedicalText + '. Why do you think this patient has ' + selectedDiseaseEn + '. Indicate the common symptoms with ' + selectedDiseaseEn + ' and the ones that he/she does not have';
            infoOptionEvent = 'Why Diagnosis';
        }

        this.lauchEvent(infoOptionEvent);
        var value = { value: introText, myuuid: this.myuuid, operation: 'info disease', lang: this.lang }
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                if (res.choices[0].message.content) {
                    let content = res.choices[0].message.content;
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
                                    this.getDifferentialDiagnosis(res.choices[0].message.content);
                                    this.loadingAnswerOpenai = false;
                                    this.lauchEvent("Info Disease");
                                }));
                        } else {
                            this.getDifferentialDiagnosis(res.choices[0].message.content);
                            this.loadingAnswerOpenai = false;
                            this.lauchEvent("Info Disease");
                        }
                    } else {
                        var tempInfo = res.choices[0].message.content;
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
                                    var textToTA = this.premedicalText.replace(/\n/g, " ");
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
                                        this.answerOpenai = res.choices[0].message.content;
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
                } else {
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
            this.optionSelected = this.options[0];
            this.closeDiseaseUndiagnosed();

            this.medicalText2 = newSymptoms;
            this.verifCallOpenAi2();
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

    async recalculate(option) {
        this.showInputRecalculate = true;
        this.optionSelected = this.options[option];
        //this.focusTextArea();
        await this.delay(200);
        document.getElementById('optionssteps').scrollIntoView({ behavior: "smooth" });
    }

    clearText2() {
        this.medicalText2 = '';
        this.medicalText2Copy = '';
        this.showErrorCall2 = false;
        document.getElementById("textarea2").setAttribute("style", "height:50px;overflow-y:hidden; width: 100%;");
    }

    verifCallOpenAi2() {
        this.showErrorCall2 = false;
        if (this.callingOpenai || this.medicalText2.length == 0) {
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
            this.callOpenAi2();
        }
    }

    callOpenAi2() {
        if (this.medicalText2.length > 0) {
            Swal.fire({
                title: this.translate.instant("generics.Please wait"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false
            }).then((result) => {

            });
            if(this.detectedLang != 'en'){
                var info = [{ "Text": this.medicalText2 }]
                this.subscription.add(this.apiDx29ServerService.getTranslationDictionary(this.detectedLang, info)
                    .subscribe((res2: any) => {
                        var textToTA = this.medicalText2.replace(/\n/g, " ");
                        if (res2[0] != undefined) {
                            if (res2[0].translations[0] != undefined) {
                                textToTA = res2[0].translations[0].text;
                            }
                        }
                        this.medicalText2Copy = textToTA;
                        this.preparingCallOpenAi('step4');
                    }, (err) => {
                        this.medicalText2Copy = this.medicalText2;
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.preparingCallOpenAi('step4');
                    }));
            }else{
                this.medicalText2Copy = this.medicalText2;
                this.preparingCallOpenAi('step4'); 
            }
        } else {
            this.preparingCallOpenAi('step4');
        }


    }

    focusTextArea() {
        setTimeout(function () {
            this.inputTextAreaElement.nativeElement.focus();
        }.bind(this), 200);
    }

    closeDiseaseUndiagnosed() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
    }

    restartAllVars() {
        this.topRelatedConditions = [];
    }

    restartInitVars() {
        this.medicalText = '';
        this.copyMedicalText = '';
        this.restartAllVars();
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
            this.jsPDFService.generateResultsPDF(this.medicalText, infoDiseases, this.lang)
            this.lauchEvent("Download results");
        }

    }

    getDiseaseInfo(diseases: any[]): { name: string, description: string }[] {
        return diseases.map(disease => {
            return {
                name: disease.name,
                description: disease.content
            };
        });
    }

    getLiteral(literal) {
        return this.translate.instant(literal);
    }

    vote(valueVote, contentFeedbackDown) {
        this.sendingVote = true;
        let paramIntroText = this.optionRare;
        if (this.selectorRare) {
            paramIntroText = this.optionCommon;
        }
        let introText = this.translate.instant("land.prom1", {
            value: paramIntroText
        })
        var value = { value: introText + " " + this.medicalText + " Call Text: " + this.premedicalText, myuuid: this.myuuid, operation: 'vote', lang: this.lang, vote: valueVote, topRelatedConditions: this.topRelatedConditions }
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
        let paramIntroText = this.optionRare;
        if (this.selectorRare) {
            paramIntroText = this.optionCommon;
        }
        let introText = this.translate.instant("land.prom1", {
            value: paramIntroText
        })

        var value = { email: this.feedBack2input, myuuid: this.myuuid, lang: this.lang, info: this.feedBack1input, value: introText  + " " + this.medicalText + " Call Text: " + this.premedicalText, topRelatedConditions: this.topRelatedConditions, subscribe: this.checkSubscribe }
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

    resizeTextArea2() {
        this.resizeTextAreaFunc(this.textAreas2);
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
            height = height + 10;
            this.renderer.setStyle(nativeElement, 'height', `${height}px`);
        });
    }

    selectorRareEvent(event) {
        this.selectorRare = event;
    }

    selectorRareEvent2(event) {
        this.selectorRare = event;
        this.prevSelectorRare = this.selectorRare;
        this.verifCallOpenAi('step2');
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
        var info = { value: this.medicalText, myuuid: value.myuuid, operation: value.operation, lang: this.lang, response: response, topRelatedConditions: this.topRelatedConditions }
        this.subscription.add(this.apiDx29ServerService.postAnonymize(info)
            .subscribe((res: any) => {
                let parseChoices = res.choices[0].message.content;
                parseChoices = parseChoices.replace(/^"""\n/, '').replace(/\s*"""$/, '');
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
                    this.medicalText = this.copyResultAnonymized;
                    this.premedicalText = this.copyResultAnonymized;
                    this.callingAnonymize = false;
                    this.hasAnonymize = true;
                    if (!localStorage.getItem('dontShowSwal')) {

                        let detectePer = this.translate.instant("diagnosis.detected personal information")
                        let procDelete = this.translate.instant("diagnosis.proceeded to delete")
                        let msgcheck = this.translate.instant("land.check")
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
            if (detectedText) {
                Swal.fire({
                    icon: 'success',
                    html: this.translate.instant("diagnosis.correctly anonymized"),
                    showCancelButton: false,
                    showConfirmButton: true,
                    allowOutsideClick: false
                }).then((result) => {
                    if (this.modalReference != undefined) {
                        this.modalReference.close();
                        this.modalReference = undefined;
                    }
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    html: this.translate.instant("diagnosis.not detected personal information"),
                    showCancelButton: false,
                    showConfirmButton: true,
                    allowOutsideClick: false
                }).then((result) => {
                    if (this.modalReference != undefined) {
                        this.modalReference.close();
                        this.modalReference = undefined;
                    }
                });
            }
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

    openModal(panel) {
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference = this.modalService.open(panel, ngbModalOptions);
    }
    async openDescripModal(panel) {
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-lg'// xl, lg, sm
        };
        this.modalReference = this.modalService.open(panel, ngbModalOptions);
        await this.delay(200);
        this.resizeTextArea();
    }

    
}
