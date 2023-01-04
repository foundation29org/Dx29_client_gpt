import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Injectable } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs/Subscription';
import { EventsService } from 'app/shared/services/events.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { SortService } from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { Clipboard } from "@angular/cdk/clipboard"
import { v4 as uuidv4 } from 'uuid';
import { GoogleAnalyticsService } from 'app/shared/services/google-analytics.service';
import { SearchFilterPipe } from 'app/shared/services/search-filter.service';
import { DialogService } from 'app/shared/services/dialog.service';
import { jsPDFService } from 'app/shared/services/jsPDF.service'

//import { Observable } from 'rxjs/Observable';
import { Observable, of, OperatorFunction } from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'
import { KeyValue } from '@angular/common';
import { SlowBuffer } from 'buffer';


var $primary = "#975AFF",
    $success = "#40C057",
    $info = "#2F8BE6",
    $warning = "#F77E17",
    $danger = "#F55252",
    $label_color_light = "#E6EAEE";
var themeColors = [$primary, $warning, $success, $danger, $info];
declare let gtag: any;
declare var JSZipUtils: any;
declare var Docxgen: any;

@Component({
    selector: 'app-undiagnosed-page',
    templateUrl: './undiagnosed-page.component.html',
    styleUrls: ['./undiagnosed-page.component.scss'],
    providers: [ApiDx29ServerService, jsPDFService],
})

export class UndiagnosedPageComponent implements OnInit, OnDestroy, AfterViewInit {

    private subscription: Subscription = new Subscription();
    medicalText: string = '';
    premedicalText: string = '';
    medicalText2: string = '';
    medicalText2Copy: string = '';
    copyMedicalText: string = '';
    modalReference: NgbModalRef;
    topRelatedConditions: any = [];
    lang: string = 'en';
    originalLang: string = 'en';
    detectedLang: string = 'en';
    selectedInfoDiseaseIndex: number = -1;
    minSymptoms: number = 2;
    _startTime: any;


    @ViewChild("inputTextArea") inputTextAreaElement: ElementRef;
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
    selectorRare: boolean = false;
    prevSelectorRare: boolean = false;
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

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, public translate: TranslateService, private sortService: SortService, private searchService: SearchService, public toastr: ToastrService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private eventsService: EventsService, public googleAnalyticsService: GoogleAnalyticsService, public searchFilterPipe: SearchFilterPipe, public dialogService: DialogService, public jsPDFService: jsPDFService) {

        this.lang = sessionStorage.getItem('lang');
        this.originalLang = sessionStorage.getItem('lang');

        $.getScript("./assets/js/docs/jszip-utils.js").done(function (script, textStatus) {
            //console.log("finished loading and running jszip-utils.js. with a status of" + textStatus);
        });

        $.getScript("./assets/js/docs/docxtemplater.v2.1.5.js").done(function (script, textStatus) {
            //console.log("finished loading and running docxtemplater.js. with a status of" + textStatus);
        });

        //this.googleAnalyticsService.eventEmitter("OpenDx - init: "+result, "general", this.myuuid);
        //this.googleAnalyticsService.eventEmitter("OpenDx - init", "general", this.myuuid, 'init', 5);
        this._startTime = Date.now();

        if (sessionStorage.getItem('uuid') != null) {
            this.myuuid = sessionStorage.getItem('uuid');
        } else {
            this.myuuid = uuidv4();
            sessionStorage.setItem('uuid', this.myuuid);
        }

        this.steps = [
            { stepIndex: 1, isComplete: false, title: this.translate.instant("land.step1") },
            { stepIndex: 2, isComplete: false, title: this.translate.instant("land.step3") }
        ];
        this.currentStep = this.steps[0];

    }

    initQuestions() {
        this.questions = [
            { id: 1, question: this.translate.instant("land.q1") },
            { id: 2, question: this.translate.instant("land.q2") },
            { id: 3, question: this.translate.instant("land.q3") },
            { id: 4, question: this.translate.instant("land.q4") }
        ];
    }

    initOptions() {
        this.options = [
            { id: 1, value: this.translate.instant("land.option1"), label: this.translate.instant("land.labelopt1") },
            { id: 2, value: this.translate.instant("land.option2"), label: this.translate.instant("land.labelopt2") },
            { id: 3, value: this.translate.instant("land.option3"), label: this.translate.instant("land.labelopt3") }
        ];

        window.scrollTo(0, 0);

    }

    async goPrevious() {
        this.showInputRecalculate = false;
        this.currentStep = this.steps[0];
        document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
        await this.delay(200);
        this.clearText();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
            return false;
        } else {
            return true;
        }
        //return true;
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
        }
        if (!savedEvent) {
            this.eventList.push({ name: category });
            gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
        }
    }

    ngOnInit() {
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
                    confirmButtonColor: '#00B4CC',
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
            this.showDisclaimer();
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

    showDisclaimer() {
        if (localStorage.getItem('hideIntroLogins') == null || !localStorage.getItem('hideIntroLogins')) {
            document.getElementById("openModalIntro").click();
        }
    }

    showOptions($event) {
        if ($event.checked) {
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

    ngAfterViewInit() {
        //this.focusTextArea();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    copyText(par) {
        if (par == 'opt1') {
            this.medicalText = this.translate.instant("land.p1.1")
        } else {
            this.medicalText = this.translate.instant("land.p1.2")
        }
        document.getElementById('optioninput1').scrollIntoView({ behavior: "smooth" });
        //this.focusTextArea();
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
    }

    verifCallOpenAi(step) {
        this.showErrorCall1 = false;
        if (this.callingOpenai || this.medicalText.length < 5) {
            this.showErrorCall1 = true;
        }
        if (!this.showErrorCall1) {
            this.preparingCallOpenAi(step);
        }
    }


    preparingCallOpenAi(step) {
        this.callingOpenai = true;
        if(step=='step3'|| (step=='step2' && this.showInputRecalculate && this.medicalText2.length>0)){
            this.premedicalText = this.copyMedicalText + '. ' + this.optionSelected.value + ' ' + this.medicalText2Copy;
        }else{
            this.premedicalText = this.medicalText;
        }
        var testLangText = this.premedicalText.substr(0, 4000)
        if (testLangText.length > 0) {
            this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
                .subscribe((res: any) => {
                    if (res[0].language != 'en') {
                        this.detectedLang = res[0].language;
                        var info = [{ "Text": this.premedicalText }]
                        this.subscription.add(this.apiDx29ServerService.getTranslationDictionary(res[0].language, info)
                            .subscribe((res2: any) => {
                                console.log(res2);
                                var textToTA = this.premedicalText.replace(/\n/g, " ");
                                if (res2[0] != undefined) {
                                    if (res2[0].translations[0] != undefined) {
                                        textToTA = res2[0].translations[0].text;
                                    }
                                }
                                this.premedicalText = textToTA;
                                console.log(this.premedicalText)
                                this.callOpenAi(step);
                            }, (err) => {
                                console.log(err);
                                this.callOpenAi(step);
                            }));
                    } else {
                        this.detectedLang = 'en';
                        this.callOpenAi(step);
                    }

                }, (err) => {
                    console.log(err);
                    this.toastr.error('', this.translate.instant("generics.error try again"));
                    this.callingOpenai = false;
                }));
        } else {
            this.callOpenAi(step);
        }

    }

    callOpenAi(step) {
        //var resp= {"id":"cmpl-6MfILJTSmgXJK0pXe4YYpsFST9SjE","object":"text_completion","created":1670859973,"model":"text-davinci-003","choices":[{"text":"\n\n1. Rasmussen Syndrome (25%): A rare neurological disorder characterized by progressive inflammation and atrophy of one hemisphere of the brain, resulting in seizures, paralysis, and cognitive decline. \n2. Sturge-Weber Syndrome (15%): A rare neurological disorder characterized by a port-wine stain on the face, seizures, and progressive neurological decline. \n3. Aicardi Syndrome (10%): A rare neurological disorder characterized by seizures, spasticity, and cognitive decline. \n4. West Syndrome (5%): A rare neurological disorder characterized by infantile spasms, developmental delay, and cognitive decline. \n5. Alexander Disease (2%): A rare neurological disorder characterized by progressive brain atrophy, seizures, and cognitive decline.","index":0,"logprobs":null,"finish_reason":"stop"}],"usage":{"prompt_tokens":60,"completion_tokens":157,"total_tokens":217}}
        /*let resp= {"id":"cmpl-6N2qhS30XcdC2k2siIo1iG6ch1cOk","object":"text_completion","created":1670950515,"model":"text-davinci-003","choices":[{"text":"\n\n1. Rasmussen Syndrome (25%): A rare neurological disorder characterized by progressive unilateral hemispheric atrophy, drug-resistant focal epilepsy, progressive hemiplegia, and cognitive decline. \n2. Sturge-Weber Syndrome (15%): A rare neurological disorder characterized by unilateral facial port-wine stains, seizures, and neurological deficits. \n3. Aicardi Syndrome (10%): A rare neurological disorder characterized by the absence of the corpus callosum, seizures, and neurological deficits. \n4. Alexander Disease (5%): A rare neurological disorder characterized by progressive brain atrophy, seizures, and cognitive decline. \n5. Leigh Syndrome (5%): A rare neurological disorder characterized by progressive brain and spinal cord degeneration, seizures, and cognitive decline.","index":0,"logprobs":null,"finish_reason":"stop"}],"usage":{"prompt_tokens":60,"completion_tokens":163,"total_tokens":223}}

          let parseChoices = resp.choices[0].text.split("\n");
          let test = resp.choices[0].text.charAt(0)
          if(test=='.'){
                parseChoices.shift();
          }
          this.topRelatedConditions = [];
          for (let i = 0; i < parseChoices.length; i++) {
            if(parseChoices[i]!=''){
                this.topRelatedConditions.push(parseChoices[i])
            }
          }
          console.log(this.topRelatedConditions);
          this.currentStep = this.steps[1];
          this.callingOpenai = false;
          window.scrollTo(0, 0);*/
        // call api POST openai

        Swal.fire({
            html: '<p>' + this.translate.instant("land.swal") + '</p>'+ '<p>' + this.translate.instant("land.swal2") + '</p>' + '<p><em class="fa fa-spinner fa-2x fa-spin fa-fw"></em></p>',
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: this.translate.instant("generics.Cancel"),
            allowOutsideClick: false
        }).then(function (event) {
            console.log(event);
            console.log('entra')
            console.log(Swal.DismissReason.cancel)
            console.log(event.dismiss)
            if (event.dismiss == Swal.DismissReason.cancel) {

                // function when confirm button clicked
                this.callingOpenai = false;
                this.subscription.unsubscribe();
                this.subscription = new Subscription();
                if (step == 'step2') {
                    this.selectorRare = this.prevSelectorRare;
                }
            }

        }.bind(this));

        this.callingOpenai = true;
        let paramIntroText = this.optionRare;
        if (this.selectorRare) {
            paramIntroText = this.optionCommon;
        }
        let introText = this.translate.instant("land.prom1", {
            value: paramIntroText
        })
        var value = { value: introText + this.symtpmsLabel + " " + this.premedicalText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang }
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                if (this.currentStep.stepIndex == 1 || step == 'step2') {
                    this.copyMedicalText = this.premedicalText;
                }
                let parseChoices0 = res.choices[0].text;
                if (res.choices[0].text.indexOf("\n\n") != -1) {
                    parseChoices0 = res.choices[0].text.split("\n\n");
                    parseChoices0.shift();
                }
                if(this.detectedLang!='en'){
                    console.log(parseChoices0);
                    var jsontestLangText = [{ "Text": parseChoices0[0] }]
                    if(parseChoices0.length>1 && Array.isArray(parseChoices0)){
                        var sendInfo='';
                        for (let i = 0; i < parseChoices0.length; i++) {
                            sendInfo = sendInfo+parseChoices0[i]+'\n';
                        }
                        jsontestLangText = [{ "Text": sendInfo}]
                    }
                    if(!Array.isArray(parseChoices0)){
                        jsontestLangText = [{ "Text": parseChoices0 }]
                    }
                    
                    this.subscription.add(this.apiDx29ServerService.getSegmentation(this.detectedLang,jsontestLangText)
                    .subscribe( (res2 : any) => {
                        console.log(res2)
                        if (res2[0] != undefined) {
                            if (res2[0].translations[0] != undefined) {
                                parseChoices0 = res2[0].translations[0].text;
                            }
                        }
                        this.continueCallOpenAi(parseChoices0);
                    }, (err) => {
                        console.log(err);
                        this.continueCallOpenAi(parseChoices0);
                    }));
                }else{
                    this.continueCallOpenAi(parseChoices0);
                }
                
            }, (err) => {
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
            }));

    }

    continueCallOpenAi(parseChoices0){
        let parseChoices = parseChoices0;
        console.log(parseChoices);
        if(!Array.isArray(parseChoices0)){
            if (parseChoices0.indexOf("\n") != -1) {
                parseChoices = parseChoices0.split("\n");
                let test = parseChoices[0].charAt(0)
                if (test == '.') {
                    parseChoices.shift();
                }
            }
        }else{
            if (parseChoices0[0].indexOf("\n") != -1) {
                parseChoices = parseChoices0[0].split("\n");
                let test = parseChoices[0].charAt(0)
                if (test == '.') {
                    parseChoices.shift();
                }
            }
        }
        
        this.topRelatedConditions = [];
        for (let i = 0; i < parseChoices.length; i++) {
            if (parseChoices[i] != '') {
                this.topRelatedConditions.push(parseChoices[i])
            }
        }
        if (this.currentStep.stepIndex == 1) {
            this.currentStep = this.steps[1];
        }
        this.callingOpenai = false;
        Swal.close();
        //window.scrollTo(0, 0);
        this.lauchEvent("Search Disease");
        this.scrollTo();
    }

    async scrollTo() {
        await this.delay(400);
        document.getElementById('step2').scrollIntoView({ behavior: "smooth" });
    }




    showQuestion(question, index) {
        /*var testRes= {"id":"cmpl-6KmXVRaPvar50l7SgRNVTiosKsCiQ","object":"text_completion","created":1670411165,"model":"text-davinci-003","choices":[{"text":"\n\nCommon symptoms of Dravet Syndrome include:\n\n-Frequent and/or prolonged seizures\n-Developmental delays\n-Speech delays\n-Behavioral and social challenges\n-Sleep disturbances\n-Growth and nutrition issues\n-Sensory integration dysfunction\n-Movement and balance issues\n-Weak muscle tone (hypotonia)\n-Delayed motor skills","index":0,"logprobs":null,"finish_reason":"stop"}],"usage":{"prompt_tokens":13,"completion_tokens":80,"total_tokens":93}}
        this.answerOpenai = testRes.choices[0].text;*/
        this.symptomsDifferencial = [];
        this.answerOpenai = '';
        this.loadingAnswerOpenai = true;
        var introText = question.question + ' ' + this.selectedDisease + '?';
        if(index==0){
            introText = 'What are the common symptoms for'+ this.selectedDisease +'? Order the list with the most probable on the top';
        }
        if(index==1){
            introText = 'Give me more information for'+ this.selectedDisease;
        }
        if(index==2){
            introText = 'Provide a diagnosis test for'+ this.selectedDisease;
        }
        if(index==3){
            introText = this.premedicalText+'. What other symptoms could you find out to make a differential diagnosis of '+this.selectedDisease + ' Order the list with the most probable on the top';
        }
        var value = { value: introText, myuuid: this.myuuid, operation: 'info disease', lang: this.lang }
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                let parseChoices0 = res.choices[0].text;
                if (res.choices[0].text.indexOf("\n\n") != -1) {
                    parseChoices0 = res.choices[0].text.split("\n\n");
                    parseChoices0.shift();
                }
                if(index==3){
                    if (this.detectedLang != 'en' && index==3) {
                        console.log(parseChoices0);
                        var jsontestLangText = [{ "Text": parseChoices0[0] }]
                        if(parseChoices0.length>1 && Array.isArray(parseChoices0)){
                            var sendInfo='';
                            for (let i = 0; i < parseChoices0.length; i++) {
                                sendInfo = sendInfo+parseChoices0[i]+'\n';
                            }
                            jsontestLangText = [{ "Text": sendInfo}]
                        }
                        if(!Array.isArray(parseChoices0)){
                            jsontestLangText = [{ "Text": parseChoices0 }]
                        }
                        
                        this.subscription.add(this.apiDx29ServerService.getSegmentation(this.detectedLang,jsontestLangText)
                        .subscribe( (res2 : any) => {
                            console.log(res2)
                            if (res2[0] != undefined) {
                                if (res2[0].translations[0] != undefined) {
                                    parseChoices0 = res2[0].translations[0].text;
                                }
                            }
                            this.getDifferentialDiagnosis(parseChoices0);
                            this.loadingAnswerOpenai = false;
                            this.lauchEvent("Info Disease");
                        }, (err) => {
                            console.log(err);
                            this.getDifferentialDiagnosis(res.choices[0].text);
                            this.loadingAnswerOpenai = false;
                            this.lauchEvent("Info Disease");
                        }));
                    }else{
                        this.getDifferentialDiagnosis(res.choices[0].text);
                        this.loadingAnswerOpenai = false;
                        this.lauchEvent("Info Disease");
                    }
                }else{
                    var tempInfo = res.choices[0].text;
                    if(parseChoices0.length>1 && Array.isArray(parseChoices0)){
                        var sendInfo='';
                        for (let i = 0; i < parseChoices0.length; i++) {
                            sendInfo = sendInfo+parseChoices0[i]+'\n';
                        }
                        tempInfo= sendInfo;
                    }else if(parseChoices0.length==1){
                        tempInfo = parseChoices0[0] 
                    }
                    if(this.detectedLang!='en'){
                        var info = [{ "Text": tempInfo}]
                        this.subscription.add(this.apiDx29ServerService.getTranslationInvert(this.detectedLang, info)
                        .subscribe((res2: any) => {
                            console.log(res2);
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
                            console.log(err);
                            if(parseChoices0.length>1 && Array.isArray(parseChoices0)){
                                var sendInfo='';
                                for (let i = 0; i < parseChoices0.length; i++) {
                                    sendInfo = sendInfo+parseChoices0[i]+'\n';
                                }
                                this.answerOpenai = sendInfo;
                            }else if(parseChoices0.length==1){
                                this.answerOpenai = parseChoices0[0] 
                            }else{
                                this.answerOpenai = res.choices[0].text;
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
                

                
            }, (err) => {
                console.log(err);
                this.loadingAnswerOpenai = false;
            }));

    }

    getDifferentialDiagnosis(info){
        let parseChoices0 = info;
        if (info.indexOf("\n\n") != -1) {
            parseChoices0 = info.split("\n\n");
            parseChoices0.shift();
        }
        
        this.symptomsDifferencial = [];
        var parseChoices = [];
        if (parseChoices0[0].indexOf("\n") != -1) {
            parseChoices = parseChoices0[0].split("\n");
            let test = parseChoices[0].charAt(0)
            if (test == '.') {
                parseChoices.shift();
            }
        }else{
            if (parseChoices0.indexOf("\n") != -1) {
                parseChoices = parseChoices0.split("\n");
                let test = parseChoices[0].charAt(0)
                if (test == '.') {
                    parseChoices.shift();
                }
            }
        }
        this.symptomsDifferencial = [];
        for (let i = 0; i < parseChoices.length; i++) {
            if (parseChoices[i] != '') {
                var name = parseChoices[i].split(".")[1];
                this.symptomsDifferencial.push({name:name, checked: false})
            }
        }
    }

    changeSymptom(event,index){
     console.log(event); 
    }

    recalculateDifferencial(){
        var newSymptoms = '';
        for(let i=0;i<this.symptomsDifferencial.length;i++){
            if(this.symptomsDifferencial[i].checked){
                newSymptoms= newSymptoms+this.symptomsDifferencial[i].name+', ';
            }
        }
        if(newSymptoms!=''){
            this.lauchEvent("Recalculate Differencial");
            this.optionSelected = this.options[0];
            this.closeDiseaseUndiagnosed();
            this.medicalText2 = newSymptoms;
            this.verifCallOpenAi2();
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
        }
        if (!this.showErrorCall2) {
            this.callOpenAi2();
        }
    }

    callOpenAi2() {
        //this.medicalText = this.copyMedicalText + '. ' + this.optionSelected.value + ' ' + this.medicalText2;
        if (this.medicalText2.length > 0) {
            this.medicalText2Copy = this.medicalText2;
            this.subscription.add(this.apiDx29ServerService.getDetectLanguage(this.medicalText2)
                .subscribe((res: any) => {
                    if (res[0].language != 'en') {
                        this.detectedLang = res[0].language;
                        var info = [{ "Text": this.medicalText2 }]
                        this.subscription.add(this.apiDx29ServerService.getTranslationDictionary(res[0].language, info)
                            .subscribe((res2: any) => {
                                console.log(res2);
                                var textToTA = this.medicalText2.replace(/\n/g, " ");
                                if (res2[0] != undefined) {
                                    if (res2[0].translations[0] != undefined) {
                                        textToTA = res2[0].translations[0].text;
                                    }
                                }
                                this.medicalText2Copy = textToTA;
                                console.log(this.medicalText2)
                                this.preparingCallOpenAi('step3');
                            }, (err) => {
                                console.log(err);
                                this.preparingCallOpenAi('step3');
                            }));
                    } else {
                        this.preparingCallOpenAi('step3');
                    }

                }, (err) => {
                    this.preparingCallOpenAi('step3');
                    
                }));
        } else {
            this.preparingCallOpenAi('step3');
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
        //this.focusTextArea();
    }

    showMoreInfoDiseasePopup(diseaseIndex, contentInfoDisease) {
        this.answerOpenai = '';
        this.symptomsDifferencial = [];
        this.selectedInfoDiseaseIndex = diseaseIndex;
        var nameEvent = 'Undiagnosed - Select Disease - ' + this.topRelatedConditions[this.selectedInfoDiseaseIndex];
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
        //split number on string like 1.dravet 2.duchenne
        this.selectedDisease = this.topRelatedConditions[this.selectedInfoDiseaseIndex].split(/\d+\./)[1];
        //split ( on selected disease
        this.selectedDisease = this.selectedDisease.split(' (')[0];

    }

    copyResults() {
        var finalReport = "";
        var infoDiseases = this.getPlainInfoDiseases2();
        if (infoDiseases != "") {
            finalReport = this.translate.instant("diagnosis.Proposed diagnoses") + "\n" + infoDiseases;
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
            resCopy = resCopy + this.topRelatedConditions[i];
            if (i + 1 < this.topRelatedConditions.length) {
                resCopy = resCopy + "\n";
            }
        }
        return resCopy;
    }

    downloadResults() {
        var infoDiseases = this.getPlainInfoDiseases();
        this.jsPDFService.generateResultsPDF([], infoDiseases, this.lang)
        this.lauchEvent("Download results");
    }

    getPlainInfoDiseases() {
        var resCopy = [];
        for (let i = 0; i < this.topRelatedConditions.length; i++) {
            resCopy.push({ name: this.topRelatedConditions[i] });
        }
        return resCopy;
    }

    getLiteral(literal) {
        return this.translate.instant(literal);
    }

    vote(valueVote, contentFeedbackDown) {
        //this.modalReference =this.modalService.open(contentFeedbackDown, { size: 'sm' });
        //this.modalReference = this.modalService.open(contentFeedbackDown, ngbModalOptions);

        this.sendingVote = true;
        let paramIntroText = this.optionRare;
        if (this.selectorRare) {
            paramIntroText = this.optionCommon;
        }
        let introText = this.translate.instant("land.prom1", {
            value: paramIntroText
        })
        var value = { value: introText + this.symtpmsLabel + " " + this.medicalText+ " Call Text: "+ this.premedicalText, myuuid: this.myuuid, operation: 'vote', lang: this.lang, vote: valueVote, topRelatedConditions: this.topRelatedConditions }
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
                console.log(err);
                this.sendingVote = false;
            }));
    }

    onSubmitFeedbackDown() {
        this.sending = true;
        let paramIntroText = this.optionRare;
        if (this.selectorRare) {
            paramIntroText = this.optionCommon;
        }
        let introText = this.translate.instant("land.prom1", {
            value: paramIntroText
        })
        var value = { email: this.feedBack2input, myuuid: this.myuuid, lang: this.lang, info: this.feedBack1input, value: introText + this.symtpmsLabel + " " + this.medicalText+ " Call Text: "+ this.premedicalText, topRelatedConditions: this.topRelatedConditions }
        this.subscription.add(this.apiDx29ServerService.feedback(value)
            .subscribe((res: any) => {
                this.lauchEvent("Feedback");
                this.sending = false;
                this.feedBack1input = '';
                this.feedBack2input = '';
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

    async resizeTextArea() {
        setTimeout(() => {
            $('.autoajustable').each(function () {
                let height = this.scrollHeight;
                if (height < 50) {
                    height = 50;
                }
                document.getElementById("textarea1").setAttribute("style", "height:" + (height) + "px;overflow-y:hidden; width: 100%;");
            }).on('input', function () {
                let height = this.scrollHeight;
                if (height < 50) {
                    height = 50;
                }
                this.style.height = 'auto';
                this.style.height = (height) + 'px';
            });

        },
            100);
    }

    resizeTextArea2() {

        setTimeout(() => {
            $('.autoajustable2').each(function () {
                let height = this.scrollHeight;
                if (height < 50) {
                    height = 50;
                }
                document.getElementById("textarea2").setAttribute("style", "height:" + (height) + "px;overflow-y:hidden; width: 100%;");

            }).on('input', function () {
                let height = this.scrollHeight;
                if (height < 50) {
                    height = 50;
                }
                this.style.height = 'auto';
                this.style.height = (height) + 'px';
            });

        },
            100);
    }

    selectorRareEvent(event) {
        this.selectorRare = event;
    }

    selectorRareEvent2(event) {
        this.prevSelectorRare = this.selectorRare;
        this.selectorRare = event;
        this.verifCallOpenAi('step2');
    }


    onFileChangePDF(event) {
        if (event.target.files && event.target.files[0]) {
            var reader = new FileReader();
            reader.readAsDataURL(event.target.files[0]); // read file as data url
            reader.onload = (event2: any) => { // called once readAsDataURL is completed
                var the_url = event2.target.result

                var extension = (event.target.files[0]).name.substr((event.target.files[0]).name.lastIndexOf('.'));
                extension = extension.toLowerCase();
                this.langToExtract = '';
                if (event.target.files[0].type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension == '.docx') {
                    this.loadFile(the_url, function (err, content) {
                        if (err) { console.log(err); };
                        var doc = new Docxgen(content);
                        var text = doc.getFullText();
                        this.detectLanguage(text, 'otherdocs');
                        this.medicalText = text;
                        this.showPanelExtractor = true;
                        this.expanded = true;
                    }.bind(this))
                } else if (event.target.files[0].type == 'application/pdf' || extension == '.pdf' || extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif') {
                    this.parserObject.file = event.target.files[0]
                    if (extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif') {
                        this.parserObject.parserStrategy = 'OcrOnly';
                    } else {
                        this.parserObject.parserStrategy = 'OcrOnly';//Auto
                    }

                    this.callParser();

                } else {
                    Swal.fire(this.translate.instant("land.error extension"), '', "error");
                }

            }

        }
    }

    callParser() {
        Swal.fire({
            title: this.translate.instant("generics.Please wait"),
            html: '<p>'+this.translate.instant("land.Extracting the text from the document")+'</p><i class="fa fa-spinner fa-spin fa-3x fa-fw info"></i>',
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        }).then((result) => {

        });

        this.parserObject.callingParser = true;
        var self = this;
        var oReq = new XMLHttpRequest();
        var lang = this.lang;
        if (this.langToExtract != '') {
            lang = this.langToExtract;
        }

        oReq.open("PUT", environment.f29api + '/api/Document/Parse?Timeout=5000&language=' + lang + '&Strategy=' + this.parserObject.parserStrategy, true);

        var self = this;
        oReq.onload = function (oEvent) {
            Swal.close();
            self.langToExtract = '';
            self.parserObject.callingParser = false;
            // Uploaded.
            let file = oEvent.target;
            var target: any = {};
            target = file;
            //target--> status, strategy, content
            if (target.response.content == undefined) {
                self.medicalText = '';
            } else {
                self.medicalText = target.response.content
                self.medicalText = self.medicalText.split("\n").join(" ");
            }

            if (target.response.status == 'RequireOcr') {
                self.parserObject.parserStrategy = 'OcrOnly';
                Swal.fire({
                    title: self.translate.instant("parser.OcrOnlyTitle"),
                    text: self.translate.instant("parser.OcrOnlyText"),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#33658a',
                    cancelButtonColor: '#B0B6BB',
                    confirmButtonText: self.translate.instant("generics.Yes"),
                    cancelButtonText: self.translate.instant("generics.No"),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: false,
                    reverseButtons: true
                }).then((result) => {
                    if (result.value) {
                        self.callParser();
                    } else {
                        var testLangText = self.medicalText.substr(0, 4000)
                        self.detectLanguage(testLangText, 'parser');
                    }
                });

            } else {
                self.parserObject.parserStrategy = 'Auto'
                var testLangText = self.medicalText.substr(0, 4000)
                self.detectLanguage(testLangText, 'parser');
            }
        };
        oReq.send(this.parserObject.file);
        const rt = "json";
        oReq.responseType = rt;
    }

    loadFile(url, callback) {
        JSZipUtils.getBinaryContent(url, callback);
    }

    detectLanguage(testLangText, method) {
        this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
            .subscribe((res: any) => {
                var lang = this.lang;
                this.langDetected = res[0].language;
                if (this.langDetected != lang && this.parserObject.parserStrategy != 'Auto') {


                    Swal.fire({
                        title: this.translate.instant("parser.We have detected that the document is in another language"),
                        text: this.translate.instant("parser.Analyzed as") + '" "' + lang + '", "' + this.translate.instant("parser.detected as") + '" "' + res[0].language + '". "' + this.translate.instant("parser.do you want us to do it"),
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#33658a',
                        cancelButtonColor: '#B0B6BB',
                        confirmButtonText: this.translate.instant("generics.Yes"),
                        cancelButtonText: this.translate.instant("generics.No"),
                        showLoaderOnConfirm: true,
                        allowOutsideClick: false,
                        reverseButtons: true
                    }).then((result) => {
                        if (result.value) {
                            this.langToExtract = this.langDetected
                            if (method == 'parser') {
                                this.callParser();
                            }
                        } else {
                            this.langToExtract = this.langDetected
                            if (this.medicalText != '') {
                                this.callTextAnalitycs2();
                            } else {
                                Swal.fire(this.translate.instant("parser.No text has been detected in the file"), '', "error");
                            }
                        }
                    });

                } else {
                    if (this.langDetected != lang) {
                        this.langToExtract = this.langDetected
                    } else {
                        this.langToExtract = lang;
                    }
                    if (this.medicalText != '') {
                        this.callTextAnalitycs2();
                    } else {
                        Swal.fire(this.translate.instant("parser.No text has been detected in the file"), '', "error");
                    }

                }
            }, (err) => {
                console.log(err);
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }));
    }

    callTextAnalitycs2() {
        Swal.fire({
            title: this.translate.instant("generics.Please wait"),
            html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw info"></i>',
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        }).then((result) => {

        });
        this.callingTextAnalytics = true;
        var info = this.medicalText.replace(/\n/g, " ");
        var jsontestLangText = { "text": info };
        this.subscription.add(this.apiDx29ServerService.callTextAnalytics(jsontestLangText)
            .subscribe((res: any) => {
                console.log(res)
                this.resTextAnalyticsSegments = res;
                var foundDrug = false;
                var foundSyntoms = false;
                var drugs = [];
                var symtoms = [];
              for (let j = 0; j < this.resTextAnalyticsSegments.entities.length; j++) {
                
                if (this.resTextAnalyticsSegments.entities[j].category == 'MedicationName') {
                    var actualDrug = { name: '', dose: '', link: '', strength: '' };
                  actualDrug.name = this.resTextAnalyticsSegments.entities[j].text;
                  
                  if (this.resTextAnalyticsSegments.entities[j].dataSources != null) {
                    var found = false;
                    for (let k = 0; k < this.resTextAnalyticsSegments.entities[j].dataSources.length && !found; k++) {
                      if (this.resTextAnalyticsSegments.entities[j].dataSources[k].name == 'ATC') {
                        actualDrug.link = this.resTextAnalyticsSegments.entities[j].dataSources[k].entityId;
                        found = true;
                      }
                    }
                  }
                  if (this.resTextAnalyticsSegments.entityRelations != null) {
                    var found = false;
                    for (let k = 0; k < this.resTextAnalyticsSegments.entityRelations.length && !found; k++) {
                      if(this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.text==actualDrug.name && this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.category=='MedicationName' && this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.category=='Dosage'){
                        actualDrug.dose = this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.text;
                      }
                      if(this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.text==actualDrug.name && this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.category=='Dosage' && this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.category=='MedicationName'){
                        actualDrug.dose = this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.text;
                      }
                    }
    
                  }
                  drugs.push(actualDrug);
                  foundDrug = true;
                }
                if (this.resTextAnalyticsSegments.entities[j].category == 'SymptomOrSign') {
                    foundSyntoms = true;
                    symtoms.push(this.resTextAnalyticsSegments.entities[j].text);
                }
              }

            this.medicalText = '';
            if(foundDrug){
                this.medicalText = 'The patient takes the following drugs: ';
                for(let i=0;i<drugs.length;i++){
                    this.medicalText = this.medicalText + drugs[i].name + " " + drugs[i].dose + " " + drugs[i].strength + " " + drugs[i].link + ", ";
                }
            }
            if(foundSyntoms){
                this.medicalText = this.medicalText + ' The patient has the following symptoms: ';
                for(let i=0;i<symtoms.length;i++){
                    this.medicalText = this.medicalText + symtoms[i] + ", ";
                }
            }
            this.callingTextAnalytics = false;
            Swal.close();
            this.verifCallOpenAi('step1');
            

            }, (err) => {
                console.log(err);
                Swal.close();
                this.callingTextAnalytics = false;
            }));
      }
}
