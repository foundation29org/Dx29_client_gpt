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
    medicalText2: string = '';
    copyMedicalText: string = '';
    modalReference: NgbModalRef;
    topRelatedConditions: any = [];
    lang: string = 'en';
    originalLang: string = 'en';
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

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, public translate: TranslateService, private sortService: SortService, private searchService: SearchService, public toastr: ToastrService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private eventsService: EventsService, public googleAnalyticsService: GoogleAnalyticsService, public searchFilterPipe: SearchFilterPipe, public dialogService: DialogService, public jsPDFService: jsPDFService) {

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

    }

    initQuestions(){
        this.questions = [
            {id: 1, question: this.translate.instant("land.q1")},
            {id: 2, question: this.translate.instant("land.q2")},
            {id: 3, question: this.translate.instant("land.q3")}
        ];
    }

    initOptions(){
        this.options = [
            {id: 1, value: this.translate.instant("land.option1"), label: this.translate.instant("land.labelopt1")},
            {id: 2, value: this.translate.instant("land.option2"), label: this.translate.instant("land.labelopt2")},
            {id: 3, value: this.translate.instant("land.option3"), label: this.translate.instant("land.labelopt3")},
            {id: 4, value: this.translate.instant("land.option4"), label: this.translate.instant("land.labelopt4")}
        ];

        window.scrollTo(0, 0);
    }

    async goPrevious() {
        this.showInputRecalculate = false;
        this.currentStep = this.steps[0];
        document.getElementById('initsteps').scrollIntoView(true);
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
        if(category == "Info Disease"){
            var subcate = 'Info Disease - '+this.selectedDisease;
            this.eventList.push({ name: subcate });
            gtag('event', this.myuuid, { "event_category": subcate, "event_label": secs });
        }
        if (!savedEvent) {
            this.eventList.push({ name: category });
            gtag('event', this.myuuid, { "event_category": category, "event_label": secs });
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
    }

    loadTranslations() {
        this.translate.get('land.step1').subscribe((res: string) => {
            this.steps[0].title = res;
            console.log(this.steps);
        });
        this.translate.get('land.step3').subscribe(async (res: string) => {
            this.steps[1].title = res;
            console.log(this.steps);
            this.showDisclaimer();
            await this.delay(500);
            this.initQuestions();
            this.initOptions()
        });
    }

    delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
    }

    showDisclaimer(){
        if(localStorage.getItem('hideIntroLogins') == null || !localStorage.getItem('hideIntroLogins')){
            document.getElementById("openModalIntro").click();
          }
    }

    showOptions($event){
        if($event.checked){
          localStorage.setItem('hideIntroLogins', 'true')
        }else{
          localStorage.setItem('hideIntroLogins', 'false')
        }
      }

    showPanelIntro(content){
        if(this.modalReference!=undefined){
          this.modalReference.close();
        }
        let ngbModalOptions: NgbModalOptions = {
              backdrop : 'static',
              keyboard : false,
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

    copyText(par){
        if(par=='opt1'){
            this.medicalText = this.translate.instant("land.p1.1")
        }else{
            this.medicalText = this.translate.instant("land.p1.2")
        }
        console.log(this.medicalText);
        this.focusTextArea();
        this.resizeTextArea();
    }

    clearText(){
        this.medicalText = '';
        this.copyMedicalText = '';
        this.showErrorCall1 = false;
        document.getElementById("textarea1").setAttribute( "style", "height:50px;overflow-y:hidden; width: 100%;");
    }

    verifCallOpenAi(){
        this.showErrorCall1 = false;
        if(this.callingOpenai || this.medicalText.length<5){
            this.showErrorCall1 = true;
        }
        if(!this.showErrorCall1){
            this.callOpenAi();
        }
    }

    callOpenAi(){
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
        console.log(this.lang);
       this.callingOpenai = true;
        var introText = 'Build an ordered list of rare diseases based on this medical description and order this list by probability. Indicates the probability with a percentage. \n '
        if(this.lang=='es'){
            introText = 'Construye una lista ordenada de enfermedades raras basada en esta descripción médica y ordena esta lista por probabilidad. Indica la probabilidad con un porcentaje. \n '
        }
        var value = {value: introText+ "Symptoms: "+this.medicalText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang}
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                if(this.currentStep.stepIndex==1){
                    this.copyMedicalText = this.medicalText;
                }
                console.log(res);
                let parseChoices0 = res.choices[0].text.split("\n\n");
                parseChoices0.shift();
                console.log(parseChoices0);
                let parseChoices = parseChoices0;
                console.log(parseChoices0[0].indexOf("\n"));
                if(parseChoices0[0].indexOf("\n")!=-1){
                    parseChoices = parseChoices0[0].split("\n");
                    let test = parseChoices[0].charAt(0)
                    if(test=='.'){
                            parseChoices.shift();
                    }
                }
                console.log(parseChoices);
                this.topRelatedConditions = [];
                for (let i = 0; i < parseChoices.length; i++) {
                    if(parseChoices[i]!=''){
                        this.topRelatedConditions.push(parseChoices[i])
                    }
                }
                console.log(this.topRelatedConditions);
                this.currentStep = this.steps[1];
                this.callingOpenai = false;
                window.scrollTo(0, 0);
                this.lauchEvent("Search Disease");
            }, (err) => {
                console.log(err);
                this.callingOpenai = false;
            }));

    }

    showQuestion(question){
        /*var testRes= {"id":"cmpl-6KmXVRaPvar50l7SgRNVTiosKsCiQ","object":"text_completion","created":1670411165,"model":"text-davinci-003","choices":[{"text":"\n\nCommon symptoms of Dravet Syndrome include:\n\n-Frequent and/or prolonged seizures\n-Developmental delays\n-Speech delays\n-Behavioral and social challenges\n-Sleep disturbances\n-Growth and nutrition issues\n-Sensory integration dysfunction\n-Movement and balance issues\n-Weak muscle tone (hypotonia)\n-Delayed motor skills","index":0,"logprobs":null,"finish_reason":"stop"}],"usage":{"prompt_tokens":13,"completion_tokens":80,"total_tokens":93}}
        this.answerOpenai = testRes.choices[0].text;*/
        
        this.answerOpenai = '';
        this.loadingAnswerOpenai = true;
        var introText = question.question+ ' ' + this.selectedDisease+'?';
        var value = {value: introText, myuuid: this.myuuid, operation: 'info disease', lang: this.lang}
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                console.log(res);
                 this.answerOpenai = res.choices[0].text;
                this.loadingAnswerOpenai = false;
                this.lauchEvent("Info Disease");
            }, (err) => {
                console.log(err);
                this.loadingAnswerOpenai = false;
            }));
       
    }

    recalculate(option){
        this.showInputRecalculate = true;
        this.optionSelected = this.options[option];
        this.focusTextArea();
        document.getElementById('optionssteps').scrollIntoView(true);
    }

    clearText2(){
        this.medicalText2 = '';
        this.showErrorCall2 = false;
        document.getElementById("textarea2").setAttribute( "style", "height:50px;overflow-y:hidden; width: 100%;");
    }

    verifCallOpenAi2(){
        this.showErrorCall2 = false;
        if(this.callingOpenai || this.medicalText2.length==0){
            this.showErrorCall2 = true;
        }
        if(!this.showErrorCall2){
            this.callOpenAi2();
        }
    }

    callOpenAi2(){
        this.medicalText = this.copyMedicalText+ '. '+this.optionSelected.value+ ' ' +this.medicalText2;
        this.callOpenAi();
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
        
        this.selectedInfoDiseaseIndex = diseaseIndex;
        var nameEvent = 'Undiagnosed - Select Disease - '+this.topRelatedConditions[this.selectedInfoDiseaseIndex];
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
            resCopy.push({ name: this.topRelatedConditions[i]});
        }
        return resCopy;
    }

    getLiteral(literal) {
        return this.translate.instant(literal);
    }

    vote(valueVote){
        this.sendingVote = true;
        console.log(valueVote)
        var introText = 'Build an ordered list of rare diseases based on this medical description and order this list by probability. Indicates the probability with a percentage. \n '
        if(this.lang=='es'){
            introText = 'Construye una lista ordenada de enfermedades raras basada en esta descripción médica y ordena esta lista por probabilidad. Indica la probabilidad con un porcentaje. \n '
        }
        var value = {value: introText+ "Symptoms: "+this.medicalText, myuuid: this.myuuid, operation: 'vote', lang: this.lang, vote:valueVote, topRelatedConditions: this.topRelatedConditions}
        this.subscription.add(this.apiDx29ServerService.opinion(value)
            .subscribe((res: any) => {
                console.log(res);
                this.lauchEvent("Vote: "+ valueVote);
                this.sendingVote = false;
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
                this.callingOpenai = false;
                this.sendingVote = false;
            }));
    }

    async resizeTextArea(){
        setTimeout(() =>
        {
          $('.autoajustable').each(function () {
            let height = this.scrollHeight;
            if(height<50){
                height = 50;
            }
            document.getElementById("textarea1").setAttribute( "style", "height:" + (height) + "px;overflow-y:hidden; width: 100%;");
         }).on('input', function () {
            let height = this.scrollHeight;
            if(height<50){
                height = 50;
            }
             this.style.height = 'auto';
             this.style.height = (height) + 'px';
         });
    
        },
        100);
      }

      resizeTextArea2(){

        setTimeout(() =>
        {
          $('.autoajustable2').each(function () {
            let height = this.scrollHeight;
            if(height<50){
                height = 50;
            }
            document.getElementById("textarea2").setAttribute( "style", "height:" + (height) + "px;overflow-y:hidden; width: 100%;");
            
         }).on('input', function () {
            let height = this.scrollHeight;
            if(height<50){
                height = 50;
            }
             this.style.height = 'auto';
             this.style.height = (height) + 'px';
         });
    
        },
        100);
      }
}
