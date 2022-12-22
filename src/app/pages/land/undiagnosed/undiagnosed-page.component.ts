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
    selectorRare: boolean = false;
    prevSelectorRare: boolean = false;
    selectorOption: string = '';
    optionRare: string = '';
    optionCommon: string = '';
    symtpmsLabel: string = '';
    feedBack1input: string = '';
    feedBack2input: string = '';
    sending: boolean = false;

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
            {id: 3, value: this.translate.instant("land.option3"), label: this.translate.instant("land.labelopt3")}
        ];

        window.scrollTo(0, 0);
    }

    async goPrevious() {
        this.showInputRecalculate = false;
        this.currentStep = this.steps[0];
        document.getElementById('initsteps').scrollIntoView({behavior: "smooth"});
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
            if(this.currentStep.stepIndex == 2){
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
        document.getElementById('optioninput1').scrollIntoView({behavior: "smooth"});
        //this.focusTextArea();
        this.resizeTextArea();
    }

    clearText(){
        this.medicalText2 = '';
        this.showInputRecalculate =false;
        //this.medicalText = '';
        this.copyMedicalText = '';
        this.showErrorCall1 = false;
        document.getElementById("textarea1").setAttribute( "style", "height:50px;overflow-y:hidden; width: 100%;");
    }

    verifCallOpenAi(step){
        this.showErrorCall1 = false;
        if(this.callingOpenai || this.medicalText.length<5){
            this.showErrorCall1 = true;
        }
        if(!this.showErrorCall1){
            this.callOpenAi(step);
        }
    }

    callOpenAi(step){
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
            html: '<p>'+this.translate.instant("land.swal")+'</p>'+'<p><em class="fa fa-spinner fa-2x fa-spin fa-fw"></em></p>',
            showCancelButton: true,
            showConfirmButton: false,
            allowOutsideClick: false
        }).then(function(event){
            console.log(event);
            console.log('entra')
            console.log(Swal.DismissReason.cancel)
            console.log(event.dismiss)
            if(event.dismiss == Swal.DismissReason.cancel){
                
                // function when confirm button clicked
                this.callingOpenai = false;
                this.subscription.unsubscribe();
                this.subscription = new Subscription();
                if(step=='step2'){
                    this.selectorRare = this.prevSelectorRare;
                }
            }
            
         }.bind(this));

        this.callingOpenai = true;
        let paramIntroText = this.optionRare;
        if(this.selectorRare){
            paramIntroText = this.optionCommon;
        }
        let introText = this.translate.instant("land.prom1", {
            value: paramIntroText
        })
        var value = {value: introText+ this.symtpmsLabel+" "+this.medicalText, myuuid: this.myuuid, operation: 'find disease', lang: this.lang}
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                if(this.currentStep.stepIndex==1 || step=='step2'){
                    this.copyMedicalText = this.medicalText;
                }
                let parseChoices0 = res.choices[0].text.split("\n\n");
                parseChoices0.shift();
                let parseChoices = parseChoices0;
                if(parseChoices0[0].indexOf("\n")!=-1){
                    parseChoices = parseChoices0[0].split("\n");
                    let test = parseChoices[0].charAt(0)
                    if(test=='.'){
                            parseChoices.shift();
                    }
                }
                this.topRelatedConditions = [];
                for (let i = 0; i < parseChoices.length; i++) {
                    if(parseChoices[i]!=''){
                        this.topRelatedConditions.push(parseChoices[i])
                    }
                }
                if(this.currentStep.stepIndex==1){
                    this.currentStep = this.steps[1];
                }
                this.callingOpenai = false;
                Swal.close();
                //window.scrollTo(0, 0);
                this.lauchEvent("Search Disease");
                this.scrollTo();
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
    
    async scrollTo(){
        await this.delay(400);
        document.getElementById('step2').scrollIntoView({behavior: "smooth"});
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
                 this.answerOpenai = res.choices[0].text;
                this.loadingAnswerOpenai = false;
                this.lauchEvent("Info Disease");
            }, (err) => {
                console.log(err);
                this.loadingAnswerOpenai = false;
            }));
       
    }

    async recalculate(option){
        this.showInputRecalculate = true;
        this.optionSelected = this.options[option];
        //this.focusTextArea();
        await this.delay(200);
        document.getElementById('optionssteps').scrollIntoView({behavior: "smooth"});
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
        this.callOpenAi('step1');
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

    vote(valueVote, contentFeedbackDown){
          //this.modalReference =this.modalService.open(contentFeedbackDown, { size: 'sm' });
          //this.modalReference = this.modalService.open(contentFeedbackDown, ngbModalOptions);
          
        this.sendingVote = true;
        let paramIntroText = this.optionRare;
        if(this.selectorRare){
            paramIntroText = this.optionCommon;
        }
        let introText = this.translate.instant("land.prom1", {
            value: paramIntroText
        })
        var value = {value: introText+ this.symtpmsLabel+" "+this.medicalText, myuuid: this.myuuid, operation: 'vote', lang: this.lang, vote:valueVote, topRelatedConditions: this.topRelatedConditions}
        this.subscription.add(this.apiDx29ServerService.opinion(value)
            .subscribe((res: any) => {
                this.lauchEvent("Vote: "+ valueVote);
                this.sendingVote = false;
                if(valueVote=='down'){
                    this.modalReference =this.modalService.open(contentFeedbackDown);
                }else{
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

    onSubmitFeedbackDown(){
        this.sending = true;
        var value = {email: this.feedBack2input, myuuid: this.myuuid, lang: this.lang, info:this.feedBack1input}
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

      closeFeedback(){
        console.log('entra');
        /*this.feedBack1input = '';
        this.feedBack2input = '';*/
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

      selectorRareEvent(event){
        this.selectorRare= event;
      }

      selectorRareEvent2(event){
        this.prevSelectorRare = this.selectorRare;
        this.selectorRare= event;
        this.verifCallOpenAi('step2');
      }
}
