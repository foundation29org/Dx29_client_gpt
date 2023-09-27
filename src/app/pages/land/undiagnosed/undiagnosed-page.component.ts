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
import { jsPDFService } from 'app/shared/services/jsPDF.service'
import { InsightsService } from 'app/shared/services/azureInsights.service';

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
    selectedQuestion: string = '';
    closed = false;
    email: string = '';
    msgfeedBack: string = '';
    checkSubscribe: boolean = false;
    loadMoreDiseases: boolean = false;
    @ViewChild('f') feedbackDownForm: NgForm;
    showErrorForm: boolean = false;
    sponsors = [];
    
    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, public translate: TranslateService, private sortService: SortService, private searchService: SearchService, public toastr: ToastrService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private eventsService: EventsService, public googleAnalyticsService: GoogleAnalyticsService, public jsPDFService: jsPDFService, public insightsService: InsightsService) {

        this.lang = sessionStorage.getItem('lang');
        this.originalLang = sessionStorage.getItem('lang');

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

        this.loadSponsors();
    }

    loadSponsors(){
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

        window.scrollTo(0, 0);

    }

    openSupport(content){
        this.modalReference = this.modalService.open(content);
    }

    onSubmitRevolution() {
        this.sending = true;
  
        //this.mainForm.value.email = (this.mainForm.value.email).toLowerCase();
        //this.mainForm.value.lang=this.translate.store.currentLang;
        var params = {email: this.email, description: this.msgfeedBack, lang: sessionStorage.getItem('lang'), subscribe: this.checkSubscribe};
        this.subscription.add( this.http.post(environment.serverapi+'/api/subscribe/', params)
        .subscribe( (res : any) => {
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

    closeSupport(){
        this.msgfeedBack = '';
        this.email = '';
        this.checkSubscribe = false;
        this.modalReference.close();
    }


    async goPrevious() {
        this.topRelatedConditions = [];
        this.showInputRecalculate = false;
        this.currentStep = this.steps[0];
        //document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
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
            subcate = 'Info Disease - ' + this.selectedDisease+ ' - '+this.selectedQuestion
            gtag('event', subcate, { 'myuuid': this.myuuid, 'event_label': secs });
            
        }
        if (!savedEvent) {
            this.eventList.push({ name: category });
            gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
        }
    }

    ngOnInit() {
        this.showDisclaimer();
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
            //this.showDisclaimer();
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
        this.resizeTextArea();
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
        if(step=='step3'|| step=='step4'|| (step=='step2' && this.showInputRecalculate && this.medicalText2.length>0)){
            if(this.optionSelected.id==1){
                var labelMoreSymptoms = this.translate.instant("land.msgmoresymptoms")
                if(this.medicalText.indexOf(labelMoreSymptoms)==-1){
                    this.copyMedicalText = this.copyMedicalText + '. ' + this.optionSelected.value + ' ' + this.medicalText2Copy
                     this.premedicalText = this.copyMedicalText;
                     this.medicalText= this.medicalText+ '. ' + labelMoreSymptoms + ' ' + this.medicalText2;
                    
                }else{
                    this.copyMedicalText = this.copyMedicalText + ', ' + this.medicalText2Copy
                    this.premedicalText = this.copyMedicalText; 
                    this.medicalText= this.medicalText+ ', ' + this.medicalText2;
                }
            }else{
                this.premedicalText = this.copyMedicalText + '. ' + this.optionSelected.value + ' ' + this.medicalText2Copy;
            }
        }else if(this.optionSelected.id==2){
            var labeltest = this.translate.instant("land.msgtest")
            if(this.medicalText.indexOf(labeltest)==-1){
                this.copyMedicalText = this.copyMedicalText + '. ' + this.optionSelected.value + ' ' + this.medicalText2Copy
                this.premedicalText = this.copyMedicalText;
                this.medicalText= this.medicalText+ '. ' + labeltest + ' ' + this.medicalText2;
            }else{
                this.copyMedicalText = this.copyMedicalText + ', ' + this.medicalText2Copy
                this.premedicalText = this.copyMedicalText; 
                this.medicalText= this.medicalText+ ', ' + this.medicalText2;
            }
        }else{
            this.premedicalText = this.medicalText;
        }
        this.medicalText2 = '';
        this.continuePreparingCallOpenAi(step);

    }

    continuePreparingCallOpenAi(step) {
        if(step=='step3'|| step=='step4'|| (step=='step2' && this.showInputRecalculate && this.medicalText2.length>0)){
            this.callOpenAi(step);
        }else{
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
            html: '<p>' + this.translate.instant("land.swal") + '</p>'+ '<p>' + this.translate.instant("land.swal2") + '</p>' + '<p><em class="fa fa-spinner fa-2x fa-spin fa-fw"></em></p>',
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
        let introText = this.translate.instant("land.prom1", {
            value: paramIntroText
        })
        
        var value = { value: introText + this.symtpmsLabel + " " + this.premedicalText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang }
        if(this.loadMoreDiseases){
            value = { value: introText + this.symtpmsLabel + " " + this.temppremedicalText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang }
        }
        if(step == 'step3'){
            let introText2 = this.translate.instant("land.prom2", {
                value: paramIntroText
            })
            value = { value: introText2 + this.symtpmsLabel + " " + this.temppremedicalText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang }
        }
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                if (this.currentStep.stepIndex == 1 || step == 'step2') {
                    this.copyMedicalText = this.premedicalText;
                }
                let parseChoices0 = res.choices[0].message.content;
                if(res.choices[0].message.content.indexOf("\n\n") > 0 && (res.choices[0].message.content.indexOf("+") > res.choices[0].message.content.indexOf("\n\n"))){
                    parseChoices0 = res.choices[0].message.content.split("\n\n");
                    parseChoices0.shift();
                    parseChoices0 = parseChoices0.toString();
                }else if(res.choices[0].message.content.indexOf("\n") > 0 && (res.choices[0].message.content.indexOf("+") > res.choices[0].message.content.indexOf("\n"))){
                    parseChoices0 = res.choices[0].message.content.split("\n");
                    parseChoices0.shift();
                    parseChoices0 = parseChoices0.toString();
                }else if(res.choices[0].message.content.indexOf("\n\n") == 0 && (res.choices[0].message.content.indexOf("+") > res.choices[0].message.content.indexOf("\n\n"))){
                    //delete up to index "+" 
                    parseChoices0 = res.choices[0].message.content.substring(res.choices[0].message.content.indexOf("+"));
                }else if(res.choices[0].message.content.indexOf("\n") == 0 && (res.choices[0].message.content.indexOf("+") > res.choices[0].message.content.indexOf("\n"))){
                    //delete up to index "+" 
                    parseChoices0 = res.choices[0].message.content.substring(res.choices[0].message.content.indexOf("+"));
                }
                if(!this.loadMoreDiseases){
                    this.diseaseListEn = [];
                }
                if (step == 'step2') {
                    this.diseaseListEn = [];
                    this.topRelatedConditions = [];
                }
                this.setDiseaseListEn(parseChoices0);
                if(this.detectedLang!='en'){
                    var jsontestLangText = [{ "Text": parseChoices0 }]
                    this.subscription.add(this.apiDx29ServerService.getSegmentation(this.detectedLang,jsontestLangText)
                    .subscribe( (res2 : any) => {
                        if (res2[0] != undefined) {
                            if (res2[0].translations[0] != undefined) {
                                parseChoices0 = res2[0].translations[0].text;
                            }
                        }
                        this.continueCallOpenAi(parseChoices0);
                    }, (err) => {
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.continueCallOpenAi(parseChoices0);
                    }));
                }else{
                    this.continueCallOpenAi(parseChoices0);
                }
                
            }, (err) => {
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
            }));

    }

    includesElement(array, string){
        string = string.toLowerCase();
        for(let i = 0; i < array.length; i++) {            
            array[i] = array[i].toLowerCase();
            if(string.includes(array[i])){
                return true;
            }
        }
        return false;
    }

    async continueCallOpenAi(parseChoices0){
        let parseChoices = parseChoices0;
        
        //parseChoices = parseChoices0.split("+");
        parseChoices = parseChoices0.split(/\+(?=\d)/);
        if(!this.loadMoreDiseases){
            this.topRelatedConditions = [];
        }
        
        for (let i = 0; i < parseChoices.length; i++) {
            if (parseChoices[i] != '' && parseChoices[i] != "\n\n" && parseChoices[i] != "\n" && parseChoices[i].length>4) {
                this.topRelatedConditions.push({content:parseChoices[i], name: ''} )
            }
        }

        //for each top related condition Put in strong what goes before the first occurrence of :
        for (let i = 0; i < this.topRelatedConditions.length; i++) {
            let index = this.topRelatedConditions[i].content.indexOf(':');
            let index2 = this.topRelatedConditions[i].content.indexOf('<strong>');
            if (index != -1 && index2 == -1) {
                let firstPart = this.topRelatedConditions[i].content.substring(0, index + 1);
                let secondPart = this.topRelatedConditions[i].content.substring(index + 1, this.topRelatedConditions[i].content.length);
                //if secondPart is empty, delete this.topRelatedConditions[i] from array
                if(secondPart == ''){
                    this.topRelatedConditions.splice(i, 1);
                    this.diseaseListEn.splice(i, 1);
                    i--;
                    continue;
                }
                //this.topRelatedConditions[i] = '<strong>' + firstPart + '</strong>' + secondPart;
                let index3 = firstPart.indexOf('.');
                let namePart = firstPart.substring(index3+2, firstPart.length-1);
                let hasSponsor = false;
                let url = '';
                for (let j = 0; j < this.sponsors.length && !hasSponsor; j++) {
                    hasSponsor = this.includesElement(this.sponsors[j].synonyms, namePart)
                    if(hasSponsor){
                        url = this.sponsors[j].url;
                    }
                }
                
                
                this.topRelatedConditions[i] = {content: '<strong>' + firstPart + '</strong>' + secondPart, name: namePart, url: url};
            }
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
        this.showInputRecalculate = false;
    }

    cancelEdit() {
        this.showInputRecalculate = false;
        this.medicalText2 = '';
    }
    

    setDiseaseListEn(text){
        let parseChoices = text.split("+");
        for (let i = 0; i < parseChoices.length; i++) {
            if (parseChoices[i] != '' && parseChoices[i] != "\n\n" && parseChoices[i] != "\n" && parseChoices[i].length>3) {
                let index = parseChoices[i].indexOf(':');
                let firstPart = parseChoices[i].substring(0, index);
                this.diseaseListEn.push(firstPart)
            }
        }
    }

    loadMore() {
        var diseases = '';
        for (let i = 0; i < this.diseaseListEn.length; i++) {
            diseases = diseases + '+' +this.diseaseListEn[i] + ', ';
        }
        let paramIntroText = this.optionRare;
        if (this.selectorRare) {
            paramIntroText = this.optionCommon;
        }
        this.temppremedicalText = this.copyMedicalText + '. ' + "Each must have this format '\n\n+"+(this.diseaseListEn.length+1)+".' for each potencial "+paramIntroText+". The list is: "+ diseases;
        this.loadMoreDiseases = true;
        this.continuePreparingCallOpenAi('step3');
    }

    async scrollTo() {
        await this.delay(400);
        document.getElementById('initsteps').scrollIntoView({ behavior: "smooth" });
    }



    cancelCallQuestion(){
        this.symptomsDifferencial = [];
        this.answerOpenai = '';
        this.loadingAnswerOpenai = false;
        this.selectedQuestion = '';
        this.subscription.unsubscribe();
        this.subscription = new Subscription();
    }

    showQuestion(question, index) {
        /*var testRes= {"id":"cmpl-6KmXVRaPvar50l7SgRNVTiosKsCiQ","object":"text_completion","created":1670411165,"model":"text-davinci-003","choices":[{"text":"\n\nCommon symptoms of Dravet Syndrome include:\n\n-Frequent and/or prolonged seizures\n-Developmental delays\n-Speech delays\n-Behavioral and social challenges\n-Sleep disturbances\n-Growth and nutrition issues\n-Sensory integration dysfunction\n-Movement and balance issues\n-Weak muscle tone (hypotonia)\n-Delayed motor skills","index":0,"logprobs":null,"finish_reason":"stop"}],"usage":{"prompt_tokens":13,"completion_tokens":80,"total_tokens":93}}
        this.answerOpenai = testres.choices[0].message.content;*/
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
        /*if(index==0){
            introText = 'What are the common symptoms for'+ selectedDiseaseEn +'? Order the list with the most probable on the top';
        }
        if(index==1){
            introText = 'Give me more information for'+ selectedDiseaseEn;
        }
        if(index==2){
            introText = 'Provide a diagnosis test for'+ selectedDiseaseEn;
        }
        if(index==3){
            introText = this.premedicalText+'. What other symptoms that the patient does not have could you find out to make a differential diagnosis of '+selectedDiseaseEn + '. Return only a list, dont return anything before or after the list, and sort it with the most likely at the top';
        }
        if(index==4){
            introText = this.premedicalText+'. Why do you think this patient has '+selectedDiseaseEn + '. Indicate the common symptoms with '+selectedDiseaseEn +' and the ones that he/she does not have';
        }*/

        if(index==0){
            introText = 'What are the common symptoms associated with'+ selectedDiseaseEn +'? Please provide a list starting with the most probable symptoms at the top.';
        }
        if(index==1){
            introText = 'Can you provide detailed information about '+ selectedDiseaseEn+' ? I am a doctor.';
        }
        if(index==2){
            introText = 'Provide a diagnosis test for'+ selectedDiseaseEn;
        }
        if(index==3){
            introText = 'Given the medical description: '+this.premedicalText+'. , what are the potential symptoms not present in the patient that could help in making a differential diagnosis for '+selectedDiseaseEn + '. Please provide only a list, starting with the most likely symptoms at the top.';
        }
        if(index==4){
            //introText = 'Based on the medical description: '+this.premedicalText+', why do you believe the patient has '+selectedDiseaseEn + '. Please indicate the symptoms common with '+selectedDiseaseEn + ' Indicate the common symptoms with '+selectedDiseaseEn +' and those the patient does not have.';
            introText = this.premedicalText+'. Why do you think this patient has '+selectedDiseaseEn + '. Indicate the common symptoms with '+selectedDiseaseEn +' and the ones that he/she does not have';
        }
        var value = { value: introText, myuuid: this.myuuid, operation: 'info disease', lang: this.lang }
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {

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

                /*let parseChoices0 = res.choices[0].message.content;
                if (res.choices[0].message.content.indexOf("\n\n") == 0) {
                    parseChoices0 = res.choices[0].message.content.split("\n\n");
                    parseChoices0.shift();
                }else if(res.choices[0].message.content.indexOf("\n") == 0){
                    parseChoices0 = res.choices[0].message.content.split("\n");
                    parseChoices0.shift();
                }else if(res.choices[0].message.content.indexOf("\n\n") > 0 && index!=0){
                    parseChoices0 = res.choices[0].message.content.split("\n\n");
                    parseChoices0.shift();
                }else if(res.choices[0].message.content.indexOf("\n") > 0 && index!=0){
                    parseChoices0 = res.choices[0].message.content.split("\n");
                    parseChoices0.shift();
                }*/
                if(index==3){
                    if (this.detectedLang != 'en' && index==3) {
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
                            if (res2[0] != undefined) {
                                if (res2[0].translations[0] != undefined) {
                                    parseChoices0 = res2[0].translations[0].text;
                                    if(parseChoices0.indexOf("1") == 0){
                                        parseChoices0 = "\n"+parseChoices0;
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
                    }else{
                        this.getDifferentialDiagnosis(res.choices[0].message.content);
                        this.loadingAnswerOpenai = false;
                        this.lauchEvent("Info Disease");
                    }
                }else{
                    var tempInfo = res.choices[0].message.content;
                    if(parseChoices0.length>1 && Array.isArray(parseChoices0)){
                        var sendInfo='';
                        for (let i = 0; i < parseChoices0.length; i++) {
                            sendInfo = sendInfo+parseChoices0[i]+'\n';
                        }
                        tempInfo= sendInfo;
                    }else if(parseChoices0.length==1){
                        tempInfo = parseChoices0[0] 
                    }
                    var testLangText = tempInfo.substr(0, 4000)
                    this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
                .subscribe((resdet: any) => {
                    var detectedLang2 = resdet[0].language;
                    if(this.detectedLang!=detectedLang2 || this.detectedLang!='en'){
                        var langToTrnaslate = detectedLang2;
                        if(this.detectedLang!='en'){
                            langToTrnaslate = this.detectedLang;
                        }
                        var info = [{ "Text": tempInfo}]
                        this.subscription.add(this.apiDx29ServerService.getTranslationInvert(langToTrnaslate, info)
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
                            if(parseChoices0.length>1 && Array.isArray(parseChoices0)){
                                var sendInfo='';
                                for (let i = 0; i < parseChoices0.length; i++) {
                                    sendInfo = sendInfo+parseChoices0[i]+'\n';
                                }
                                this.answerOpenai = sendInfo;
                            }else if(parseChoices0.length==1){
                                this.answerOpenai = parseChoices0[0] 
                            }else{
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
                    }, (err) => {
                        this.insightsService.trackException(err);
                        console.log(err);
                        this.answerOpenai = tempInfo;
                            
                        this.loadingAnswerOpenai = false;
                        this.lauchEvent("Info Disease");
                    }));
                    
                    

                    
                }
                

                
            }, (err) => {
                this.insightsService.trackException(err);
                console.log(err);
                this.loadingAnswerOpenai = false;
            }));

    }

    getDifferentialDiagnosis(info){
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
        //si el último elemento es un espacio, eliminarlo
        if(newSymptoms.charAt(newSymptoms.length - 1) == ' '){
            newSymptoms = newSymptoms.substring(0, newSymptoms.length - 1);
        }
        // si es el último elemento, no añadir la coma
        if(newSymptoms.charAt(newSymptoms.length - 1) == ','){
            newSymptoms = newSymptoms.substring(0, newSymptoms.length - 1);
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
            Swal.fire({
                title: this.translate.instant("generics.Please wait"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false
            }).then((result) => {
    
            });
            this.medicalText2Copy = this.medicalText2;
            this.subscription.add(this.apiDx29ServerService.getDetectLanguage(this.medicalText2)
                .subscribe((res: any) => {
                    if (res[0].language != 'en') {
                        this.detectedLang = res[0].language;
                        var info = [{ "Text": this.medicalText2 }]
                        this.subscription.add(this.apiDx29ServerService.getTranslationDictionary(res[0].language, info)
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
                                this.insightsService.trackException(err);
                                console.log(err);
                                this.preparingCallOpenAi('step4');
                            }));
                    } else {
                        this.preparingCallOpenAi('step4');
                    }

                }, (err) => {
                    this.preparingCallOpenAi('step4');
                    
                }));
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
        //this.focusTextArea();
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
        //split number on string like 1.dravet 2.duchenne
        this.selectedDisease = this.topRelatedConditions[this.selectedInfoDiseaseIndex].content.split(/\d+\./)[1];
        
        //split ( on selected disease
        //this.selectedDisease = this.selectedDisease.split(' (')[0];
        this.selectedDisease = this.selectedDisease.split(':')[0];
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
        var infoDiseases = this.getPlainInfoDiseases();
        this.jsPDFService.generateResultsPDF([], infoDiseases, this.lang)
        this.lauchEvent("Download results");
    }

    getPlainInfoDiseases() {
        var resCopy = [];
        for (let i = 0; i < this.topRelatedConditions.length; i++) {
            resCopy.push({ name: this.topRelatedConditions[i].name });
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
        
        var value = { email: this.feedBack2input, myuuid: this.myuuid, lang: this.lang, info: this.feedBack1input, value: introText + this.symtpmsLabel + " " + this.medicalText+ " Call Text: "+ this.premedicalText, topRelatedConditions: this.topRelatedConditions, subscribe: this.checkSubscribe }
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
        this.selectorRare = event;
        this.prevSelectorRare = this.selectorRare;
        this.verifCallOpenAi('step2');
    }

    preCallTextAnalitycs() {
        Swal.fire({
            title: this.translate.instant("generics.Please wait"),
            html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw info"></i>',
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        }).then((result) => {

        });
        if(this.langDetected!='en'){
            var info = [{ "Text": this.medicalText }]
            this.subscription.add(this.apiDx29ServerService.getTranslationDictionary(this.langDetected, info)
                .subscribe((res2: any) => {
                    var textToTA = this.medicalText.replace(/\n/g, " ");
                    if (res2[0] != undefined) {
                        if (res2[0].translations[0] != undefined) {
                            textToTA = res2[0].translations[0].text;
                        }
                    }
                    this.medicalText = textToTA;
                    this.callTextAnalitycs2();
                }, (err) => {
                    this.insightsService.trackException(err);
                    console.log(err);
                    this.callTextAnalitycs2();
                }));
        }else{
            this.callTextAnalitycs2();
        }
        

    }
    
    callTextAnalitycs2() {
        this.callingTextAnalytics = true;
        var info = this.medicalText.replace(/\n/g, " ");
        var jsontestLangText = { "text": info };
        this.subscription.add(this.apiDx29ServerService.callTextAnalytics(jsontestLangText)
            .subscribe((res: any) => {
                this.resTextAnalyticsSegments = res;
                var foundDrug = false;
                var foundSyntoms = false;
                var drugs = [];
                var symtoms = [];
              for (let j = 0; j < this.resTextAnalyticsSegments.entities.length; j++) {
                
                if (this.resTextAnalyticsSegments.entities[j].category == 'MedicationName' && this.resTextAnalyticsSegments.entities[j].confidenceScore >= 0.85) {
                    foundDrug = true;
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
                    if(this.resTextAnalyticsSegments.entities[j].assertion !=undefined){
                        if(this.resTextAnalyticsSegments.entities[j].assertion.certainty !=undefined){
                            if(this.resTextAnalyticsSegments.entities[j].assertion.certainty == 'negative'){
                                foundDrug = false;
                            }
                        }
                    }
                    if(foundDrug){
                        drugs.push(actualDrug);
                    }
                    
                  
                }
                if (this.resTextAnalyticsSegments.entities[j].category == 'SymptomOrSign' && this.resTextAnalyticsSegments.entities[j].confidenceScore >= 0.85) {
                    foundSyntoms = true;
                    if(this.resTextAnalyticsSegments.entities[j].assertion !=undefined){
                        if(this.resTextAnalyticsSegments.entities[j].assertion.certainty !=undefined){
                            if(this.resTextAnalyticsSegments.entities[j].assertion.certainty == 'negative'){
                                foundSyntoms = false;
                            }
                        }
                    }
                    if(foundSyntoms){
                        symtoms.push(this.resTextAnalyticsSegments.entities[j].text);
                    }
                    
                }
              }

            this.medicalText = '';
            if(symtoms.length>0){
                this.medicalText = 'Based on this medical description:';
                for(let i=0;i<symtoms.length;i++){
                    this.medicalText = this.medicalText + symtoms[i] + ", ";
                }
            }
            if(drugs.length>0){
                this.medicalText = this.medicalText + 'The patient takes the following medicines: ';
                for(let i=0;i<drugs.length;i++){
                    //this.medicalText = this.medicalText + drugs[i].name + " " + drugs[i].dose + " " + drugs[i].strength + " " + drugs[i].link + ", ";
                    this.medicalText = this.medicalText + drugs[i].name + ", ";
                }
            }
            
            this.callingTextAnalytics = false;
            Swal.close();
            this.verifCallOpenAi('step1');
            

            }, (err) => {
                this.insightsService.trackException(err);
                console.log(err);
                Swal.close();
                this.callingTextAnalytics = false;
            }));
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
}
