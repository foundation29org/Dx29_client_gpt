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

import { TextTransform } from 'app/shared/services/transform-text.service';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { Apif29NcrService } from 'app/shared/services/api-f29ncr.service';
import { ApiExternalServices } from 'app/shared/services/api-external.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { SortService } from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { HighlightSearch } from 'app/shared/services/search-filter-highlight.service';
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

declare var JSZipUtils: any;
declare var Docxgen: any;
//let phenotypesinfo = [];
declare let gtag: any;
/*
declare var device;
declare global {
    interface Navigator {
      app: {
          exitApp: () => any; // Or whatever is the type of the exitApp function
      },
      splashscreen:any
    }
}*/

@Injectable()
export class SearchTermService {
    constructor(private apiDx29ServerService: ApiDx29ServerService) { }

    search(term: string) {
        if (term === '') {
            return of([]);
        }
        var info = {
            "text": term,
            "lang": sessionStorage.getItem('lang')
        }
        return this.apiDx29ServerService.searchSymptoms(info).pipe(
            map(response => response)
        );
    }
}

@Component({
    selector: 'app-undiagnosed-page',
    templateUrl: './undiagnosed-page.component.html',
    styleUrls: ['./undiagnosed-page.component.scss'],
    providers: [Apif29BioService, Apif29NcrService, ApiDx29ServerService, ApiExternalServices, SearchTermService, jsPDFService],
})

export class UndiagnosedPageComponent implements OnInit, OnDestroy, AfterViewInit {

    private subscription: Subscription = new Subscription();
    private subscriptionDiseasesCall: Subscription = new Subscription();
    private subscriptionDiseasesNotFound: Subscription = new Subscription();
    private timeSubscription: Subscription = new Subscription();
    parserObject: any = { parserStrategy: 'Auto', callingParser: false, file: undefined };
    showPanelExtractor: boolean = false;
    expanded: boolean = true;
    medicalText: string = '';
    resultTextNcrCopy: string = '';
    ncrResultView: boolean = false;
    searchTerm: string = '';
    loadingHpoExtractor: boolean = false;
    substepExtract: string = "0";
    langToExtract: string = '';
    resultSegmentation: any = {};
    temporalSymptoms: any = [];
    symptomsTimeLine: any = [];
    resultTextNcr: string = '';
    selectedInfoSymptomIndex: number = -1;
    modalReference: NgbModalRef;
    temporalDiseases: any = [];
    topRelatedConditions: any = [];
    indexListRelatedConditions: number = 8;
    showNumerRelatedConditions: number = 8;
    langDetected: string = '';
    loadingCalculate: boolean = false;
    isFirstCalculate: boolean = true;
    lang: string = 'en';
    originalLang: string = 'en';
    selectedInfoDiseaseIndex: number = -1;
    totalDiseasesLeft: number = -1;
    numberOfSymtomsChecked: number = 0;
    minSymptoms: number = 2;
    @ViewChild('input') inputEl;
    showButtonScroll: boolean = false;
    failAnnotate_batch: boolean = false;
    failSegmentation: boolean = false;
    lucky: boolean = false;
    showErrorMsg: boolean = false;
    modelTemp: any;
    _startTime: any;
    role: string = '';
    sendSympTerms: boolean = false;

    callListOfSymptoms: boolean = false;
    modalReference3: NgbModalRef;
    modalReference4: NgbModalRef;
    modalReference6: NgbModalRef;
    email: string = '';
    nothingFoundSymptoms: boolean = false;
    selectedNoteSymptom = null;

    //@ViewChild("inputTextArea") inputTextAreaElement: ElementRef;
    @ViewChild("inputManualSymptoms") inputTextAreaElement: ElementRef;
    @ViewChild("inputManualSymptoms") inputManualSymptomsElement: ElementRef;

    myuuid: string = uuidv4();
    eventList: any = [];
    secondToResponse: string = '';
    reloadDiseases: boolean = false;
    timeoutWait: number = 2000;

    formatter1 = (x: { name: string }) => x.name;
    optionSymptomAdded: string = "textarea";

    steps = [];
    currentStep: any = {};

    paramsTimeLine: any = {};
    loadingPdf: boolean = false;
    resTextAnalyticsSegments = [];
    country: string = '';
    sponsors = [];
    questions: any = [];
    answerOpenai: string = '';
    callingOpenai: boolean = false;
    loadingAnswerOpenai: boolean = false;
    selectedDisease: string = '';

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, private apif29BioService: Apif29BioService, private apif29NcrService: Apif29NcrService, public translate: TranslateService, private sortService: SortService, private searchService: SearchService, public toastr: ToastrService, private modalService: NgbModal, private apiDx29ServerService: ApiDx29ServerService, private clipboard: Clipboard, private textTransform: TextTransform, private eventsService: EventsService, private highlightSearch: HighlightSearch, public googleAnalyticsService: GoogleAnalyticsService, public searchFilterPipe: SearchFilterPipe, private apiExternalServices: ApiExternalServices, public dialogService: DialogService, public searchTermService: SearchTermService, public jsPDFService: jsPDFService) {


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
        console.log(this.steps);

        this.currentStep = this.steps[0];

        this.getLocationInfo();
        this.loadSponsors();
        this.initQuestions();
    }

    initQuestions(){
        this.questions = [
            {id: 1, question: 'What are the common symptoms for'},
            {id: 2, question: 'Give me more information for'},
            {id: 3, question: 'There are clinical trials for'},
            {id: 4, question: 'There are patient organizations for'}
        ];
    }


    getLocationInfo(){
        this.subscription.add(this.apiExternalServices.getInfoLocation()
            .subscribe((res: any) => {
                this.country = res.country;
            }, (err) => {
                console.log(err);
            }));
    }

    loadSponsors(){
        this.subscription.add(this.http.get('assets/jsons/sponsors.json')
            .subscribe((res: any) => {
                this.sponsors = res;
            }, (err) => {
                console.log(err);
            }));
    }

    goNext() {
        var isNext = false;
        if (this.currentStep.stepIndex == 1) {
            this.symptomsTimeLine = this.getCheckedSymptoms();
            if (this.symptomsTimeLine.length == 0) {
                Swal.fire(this.translate.instant("land.To generate the chronology"), '', "warning");
            } else {
                isNext = true;
            }
        } else if (this.currentStep.stepIndex == 2) {
            isNext = true;
        }
        if (isNext) {
            var foundElementIndex = this.searchService.searchIndex(this.steps, 'stepIndex', this.currentStep.stepIndex);
            this.currentStep = this.steps[foundElementIndex + 1];
            document.getElementById('initsteps').scrollIntoView(true);
        }

    }

    goPrevious() {
        console.log(this.currentStep.stepIndex)
        console.log(this.steps);
        var foundElementIndex = this.searchService.searchIndex(this.steps, 'stepIndex', this.currentStep.stepIndex);
        console.log(foundElementIndex);
        this.currentStep = this.steps[foundElementIndex - 1];
        console.log(this.currentStep)
        document.getElementById('initsteps').scrollIntoView(true);
    }

    navigate(step){
        if(step.stepIndex<this.currentStep.stepIndex){
            if(step.stepIndex>0){
                this.currentStep = this.steps[step.stepIndex - 1];
                //this.goPrevious();
            }
            
        }else if(step.stepIndex>this.currentStep.stepIndex){
            if(this.currentStep.stepIndex==1){
                this.directCalculate();
            }else{
                this.goNext();
            }
        }
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.modalReference6 != undefined) {
            this.modalReference6.close();
            this.modalReference6 = undefined;
            return false;
        } else if (this.modalReference4 != undefined) {
            this.modalReference4.close();
            this.modalReference4 = undefined;
            return false;
        } else if (this.modalReference3 != undefined) {
            this.modalReference3.close();
            this.modalReference3 = undefined;
            return false;
        } else if (this.modalReference != undefined) {
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
        if (category == "Symptoms") {
            var subCategory = category + ' - ' + this.optionSymptomAdded;
            var savedSubEvent = this.searchService.search(this.eventList, 'name', subCategory);
            if (!savedSubEvent) {
                this.eventList.push({ name: subCategory });
                gtag('event', this.myuuid, { "event_category": subCategory, "event_label": secs });
            }
        }else if(category == "Sponsor"){
            var subcate = 'Undiagnosed - Sponsor - '+this.topRelatedConditions[this.selectedInfoDiseaseIndex].id;
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
            this.modelTemp = '';
            if (this.temporalSymptoms.length > 0 && this.originalLang != lang) {
                Swal.fire({
                    title: this.translate.instant("land.Language has changed"),
                    text: this.translate.instant("land.Do you want to start over"),
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
                        this.originalLang = lang;
                        this.restartInitVars();
                        this.loadTranslations();
                        this.currentStep = this.steps[0];
                        this.focusTextArea();
                    } else {

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
        this.translate.get('land.step3').subscribe((res: string) => {
            this.steps[1].title = res;
            console.log(this.steps);
            this.showDisclaimer();
        });
        
    }

    showDisclaimer(){
        Swal.fire({
            html: this.translate.instant("land.disclaimer"),
            showCancelButton: false,
            showConfirmButton: true,
            allowOutsideClick: false
        })
    }

    ngAfterViewInit() {
        this.focusTextArea();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();

        if (this.subscriptionDiseasesCall) {
            this.subscriptionDiseasesCall.unsubscribe();
        }
        if (this.subscriptionDiseasesNotFound) {
            this.subscriptionDiseasesNotFound.unsubscribe();
        }
        if (this.timeSubscription) {
            this.timeSubscription.unsubscribe();
        }
        this.role = '';
    }

    selected($e) {
        $e.preventDefault();
        if (!$e.item.error) {
            var symptom = $e.item;
            var foundElement = this.searchService.search(this.temporalSymptoms, 'id', symptom.id);
            if (!foundElement) {
                this.temporalSymptoms.push({ id: symptom.id, name: symptom.name, new: true, checked: true, percentile: -1, inputType: 'manual', importance: '1', polarity: '0', synonyms: symptom.synonyms, def: symptom.desc });
                this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
                this.numberOfSymtomsChecked++;
                this.optionSymptomAdded = "Manual";
                this.lauchEvent("Symptoms");
            } else {
                var foundElementIndex = this.searchService.searchIndex(this.temporalSymptoms, 'id', symptom.id);
                if (!this.temporalSymptoms[foundElementIndex].checked) {
                    this.temporalSymptoms[foundElementIndex].checked = true;
                }
                //this.toastr.warning(this.translate.instant("generics.Name")+': '+symptom.name, this.translate.instant("phenotype.You already had the symptom"));
            }
            this.getNumberOfSymptomsChecked(false);
        }
        this.modelTemp = '';
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
                this.optionSymptomAdded = "File";
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
                    Swal.fire(this.translate.instant("dashboardpatient.error extension"), '', "error");
                }

            }

        }
    }

    loadFile(url, callback) {
        JSZipUtils.getBinaryContent(url, callback);
    }

    callParser() {
        Swal.fire({
            title: this.translate.instant("generics.Please wait"),
            html: '<i class="fa fa-spinner fa-spin fa-3x fa-fw info"></i>',
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

            self.showPanelExtractor = true;
            self.expanded = true;

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

    detectLanguage(testLangText, method) {
        this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
            .subscribe((res: any) => {
                var lang = this.lang;
                this.langDetected = res[0].language;
                if (this.langDetected != lang && this.parserObject.parserStrategy != 'Auto') {


                    Swal.fire({
                        title: this.translate.instant("patdiagdashboard.We have detected that the document is in another language"),
                        text: this.translate.instant("patdiagdashboard.Analyzed as") + '" "' + lang + '", "' + this.translate.instant("patdiagdashboard.detected as") + '" "' + res[0].language + '". "' + this.translate.instant("patdiagdashboard.do you want us to do it"),
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
                                this.callOpenAi();
                            } else {
                                Swal.fire(this.translate.instant("patdiagdashboard.No text has been detected in the file"), '', "error");
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
                        this.callOpenAi();
                    } else {
                        Swal.fire(this.translate.instant("patdiagdashboard.No text has been detected in the file"), '', "error");
                    }

                }
            }, (err) => {
                console.log(err);
                this.loadingHpoExtractor = false;
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }));
    }


    callOpenAi(){
        /*var resp= {
            "id": "cmpl-6KlrKIKTvOI0DCjNvdGeAKZQXOv3E",
            "object": "text_completion",
            "created": 1670408550,
            "model": "text-davinci-003",
            "choices": [
              {
                "text": "\n\n1. Dravet Syndrome \n2. Lennox-Gastaut Syndrome \n3. West Syndrome \n4. Epilepsy with Myoclonic-Astatic Seizures \n5. Lafora Disease \n6. Myoclonic-Astatic Epilepsy \n7. Ohtahara Syndrome \n8. Early Infantile Epileptic Encephalopathy \n9. Infantile Spasms \n10. Rasmussen Syndrome",
                "index": 0,
                "logprobs": null,
                "finish_reason": "stop"
              }
            ],
            "usage": {
              "prompt_tokens": 42,
              "completion_tokens": 102,
              "total_tokens": 144
            }
          }

          var parseChoices = resp.choices[0].text.split("\n");
          this.topRelatedConditions = [];
          for (let i = 0; i < parseChoices.length; i++) {
            if(parseChoices[i]!=''){
                this.topRelatedConditions.push(parseChoices[i])
            }
          }
          console.log(this.topRelatedConditions);
          this.substepExtract = '4';
          this.currentStep = this.steps[1];*/

        // call api POST openai
        this.callingOpenai = true;
        var introText = 'Provide a ranked list of rare diseases diagnosis for this patient based on probability: \n '
        var value = {value: introText+ "Symptoms: "+this.medicalText}
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                console.log(res);
                var parseChoices = res.choices[0].text.split("\n");
                this.topRelatedConditions = [];
                for (let i = 0; i < parseChoices.length; i++) {
                    if(parseChoices[i]!=''){
                        this.topRelatedConditions.push(parseChoices[i])
                    }
                }
                console.log(this.topRelatedConditions);
                this.substepExtract = '4';
                this.currentStep = this.steps[1];
                this.callingOpenai = false;
            }, (err) => {
                console.log(err);
                this.callingOpenai = false;
            }));
    }

    showQuestion(question, disease){
        /*var testRes= {"id":"cmpl-6KmXVRaPvar50l7SgRNVTiosKsCiQ","object":"text_completion","created":1670411165,"model":"text-davinci-003","choices":[{"text":"\n\nCommon symptoms of Dravet Syndrome include:\n\n-Frequent and/or prolonged seizures\n-Developmental delays\n-Speech delays\n-Behavioral and social challenges\n-Sleep disturbances\n-Growth and nutrition issues\n-Sensory integration dysfunction\n-Movement and balance issues\n-Weak muscle tone (hypotonia)\n-Delayed motor skills","index":0,"logprobs":null,"finish_reason":"stop"}],"usage":{"prompt_tokens":13,"completion_tokens":80,"total_tokens":93}}
        this.answerOpenai = testRes.choices[0].text;*/
        
        this.answerOpenai = '';
        this.loadingAnswerOpenai = true;
        var introText = question.question+ ' ' + disease+'?';
        var value = {value: introText}
        this.subscription.add(this.apiDx29ServerService.postOpenAi(value)
            .subscribe((res: any) => {
                console.log(res);
                 this.answerOpenai = res.choices[0].text;
                this.loadingAnswerOpenai = false;
            }, (err) => {
                console.log(err);
                this.loadingAnswerOpenai = false;
            }));
       
    }

    startExtractor() {
        this.optionSymptomAdded = "Textarea";
        if (this.medicalText.length < 5) {
            Swal.fire('', this.translate.instant("land.placeholderError"), "error");
        } else {
            var testLangText = this.medicalText.substr(0, 4000)
            this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
                .subscribe((res: any) => {
                    this.langToExtract = res[0].language;
                    this.langDetected = this.langToExtract;
                    this.callOpenAi();
                }, (err) => {
                    console.log(err);
                    this.loadingHpoExtractor = false;
                    this.toastr.error('', this.translate.instant("generics.error try again"));
                }));
        }
    }

    prepareCallNCR() {
        if (this.langToExtract != 'en') {
            this.substepExtract = '2';
            if (this.resultSegmentation.segments) {
                for (let i = 0; i < this.resultSegmentation.segments.length; i++) {
                    this.resultSegmentation.segments[i].language_source = this.langToExtract;
                }
            }
            this.resultSegmentation.language_source = this.langToExtract;
            this.subscription.add(this.apif29BioService.getTranslationDictionary('en', this.resultSegmentation)
                .subscribe((res: any) => {
                    res.language_source = this.langToExtract;
                    this.resultSegmentation = res;
                    this.callNCR();
                }, (err) => {
                    console.log(err);
                    setTimeout(function () {
                        this.prepareCallNCR();
                    }, this.timeoutWait);
                    this.timeoutWait = this.timeoutWait + 2000;
                }));
        } else {
            this.callNCR();
        }
    }

    callNCR() {
        this.numberOfSymtomsChecked = 0;
        //this.temporalSymptoms = [];
        this.failAnnotate_batch = false;
        var temporal = [];
        if (this.resultSegmentation.segments) {
            for (let i = 0; i < this.resultSegmentation.segments.length; i++) {
                if (this.langToExtract != 'en') {
                    temporal.push({ text: this.resultSegmentation.segments[i].target, source: this.resultSegmentation.segments[i].source });
                } else {
                    temporal.push({ text: this.resultSegmentation.segments[i].source });
                }

            }
        }
        this.substepExtract = '3';
        this.subscription.add(this.apif29NcrService.getAnnotate_batch(temporal)
            .subscribe((res: any) => {
                var infoNcr = res;
                if (res.message == 'Replica closed connection before replying' || res == null) {
                    Swal.close();
                    Swal.fire(this.translate.instant("generics.Warning"), 'Replica closed connection before replying', "error");
                } else if (res.message == 'Too many requests for service ncr-gpu (overloaded)') {
                    Swal.close();
                    Swal.fire(this.translate.instant("generics.Warning"), 'Too many requests for service ncr-gpu (overloaded)', "error");
                } else {
                    if (infoNcr.length > 0) {
                        var countAddedSypmtoms = 0;
                        for (var i = 0; i < infoNcr.length; i++) {
                            if (infoNcr[i].phens.length > 0) {
                                infoNcr[i].phens.sort(this.sortService.GetSortOrderNumberInverse("characters"));
                            }

                            for (var j = 0; j < infoNcr[i].phens.length; j++) {
                                var positions = [];
                                infoNcr[i].phens[j].characters[0] = parseInt(infoNcr[i].phens[j].characters[0])
                                infoNcr[i].phens[j].characters[1] = parseInt(infoNcr[i].phens[j].characters[1])
                                positions.push(infoNcr[i].phens[j].characters);
                                var text = [];
                                if (infoNcr[i].source) {
                                    text = [{ positions: positions[0], text: infoNcr[i].text, source: infoNcr[i].source }];
                                } else {
                                    text = [{ positions: positions[0], text: infoNcr[i].text }];
                                }

                                var symptomExtractor = { id: infoNcr[i].phens[j].id, name: infoNcr[i].phens[j].concept, new: true, similarity: parseFloat(infoNcr[i].phens[j].probability), positions: positions, text: text };
                                var isAdded = this.addTemporalSymptom(symptomExtractor, 'ncr');
                                if (isAdded) {
                                    countAddedSypmtoms++;
                                }

                            }
                        }
                        if (countAddedSypmtoms > 0) {
                            console.log(countAddedSypmtoms);
                            Swal.fire('', this.translate.instant("land.diagnosed.symptoms.syptomsDetected", {
                                value: countAddedSypmtoms
                            }), "success");
                        }

                        this.resultTextNcr = this.medicalText;
                        this.resultTextNcrCopy = this.medicalText;
                        //this.sortBySimilarity();

                        this.medicalText = '';

                        //getInfo symptoms
                        var hposStrins = [];
                        this.temporalSymptoms.forEach(function (element) {
                            hposStrins.push(element.id);
                        });

                        //Swal.close();
                        if (hposStrins.length == 0) {
                            //Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                            //this.medicalText = '';
                            this.substepExtract = '0';
                            Swal.fire({
                                title: this.translate.instant("phenotype.No symptoms found"),
                                text: this.translate.instant("land.Do you want to add the symptoms manually"),
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#33658a',
                                cancelButtonColor: '#B0B6BB',
                                confirmButtonText: this.translate.instant("land.add the symptoms manually"),
                                cancelButtonText: this.translate.instant("land.try again"),
                                showLoaderOnConfirm: true,
                                allowOutsideClick: false,
                                reverseButtons: true
                            }).then((result) => {
                                if (result.value) {
                                    this.substepExtract = '4';
                                    this.lauchEvent("Symptoms");
                                    this.focusManualSymptoms();
                                } else {
                                    this.focusTextArea();
                                }
                            });
                        } else {
                            this.callGetInfoTempSymptomsJSON(hposStrins);
                        }

                    } else {
                        this.substepExtract = '4';
                        this.lauchEvent("Symptoms");
                        Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                        this.focusManualSymptoms();
                    }

                    this.loadingHpoExtractor = false;
                }

            }, (err) => {
                console.log(err);
                this.failAnnotate_batch = true;
                //fail getAnnotate_batch
                this.callNoSegmentation();
                Swal.close();
            }));
    }

    focusManualSymptoms() {
        setTimeout(function () {
            if (this.temporalSymptoms.length == 0) {
                this.inputManualSymptomsElement.nativeElement.focus();
            }
            this.getNumberOfSymptomsChecked(false);
            /*var showSwalSelSymptoms = localStorage.getItem('showSwalSelSymptoms');
            if (showSwalSelSymptoms != 'false') {
                if(this.temporalSymptoms.length==0){
                    this.inputManualSymptomsElement.nativeElement.focus();
                }
            }*/
        }.bind(this), 200);
    }

    focusTextArea() {
        setTimeout(function () {
            this.inputTextAreaElement.nativeElement.focus();
        }.bind(this), 200);
    }

    callNoSegmentation() {
        this.subscription.add(this.apif29NcrService.getNoSegmentation(this.medicalText)
            .subscribe((res: any) => {
                var infoNcr = res.result;
                if (infoNcr != undefined) {
                    if (infoNcr.length > 0) {
                        var countAddedSypmtoms = 0;
                        for (var i = 0; i < infoNcr.length; i++) {
                            var positions = [];
                            infoNcr[i].characters[0] = parseInt(infoNcr[i].characters[0])
                            infoNcr[i].characters[1] = parseInt(infoNcr[i].characters[1])
                            positions.push(infoNcr[i].characters);
                            var text = [];
                            text = [{ positions: positions[0], text: infoNcr[i].concept }];
                            var symptomExtractor = { id: infoNcr[i].id, name: infoNcr[i].concept, new: true, similarity: parseFloat(infoNcr[i].probability), positions: positions, text: text };
                            var isAdded = this.addTemporalSymptom(symptomExtractor, 'ncrOld');
                            if (isAdded) {
                                countAddedSypmtoms++;
                            }
                        }

                        if (countAddedSypmtoms > 0) {
                            console.log(countAddedSypmtoms);
                            Swal.fire('', this.translate.instant("land.diagnosed.symptoms.syptomsDetected", {
                                value: countAddedSypmtoms
                            }), "success");
                        }
                        
                        this.resultTextNcr = this.medicalText;
                        this.resultTextNcrCopy = this.medicalText;
                        //this.sortBySimilarity();

                        this.medicalText = '';

                        //getInfo symptoms
                        var hposStrins = [];
                        this.temporalSymptoms.forEach(function (element) {
                            hposStrins.push(element.id);
                        });

                        //Swal.close();
                        if (hposStrins.length == 0) {
                            Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                            this.medicalText = '';
                            this.substepExtract = '0';
                        } else {
                            this.callGetInfoTempSymptomsJSON(hposStrins);
                        }
                    } else {
                        this.substepExtract = '4';
                        this.lauchEvent("Symptoms");
                        Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                        this.focusManualSymptoms();
                    }
                } else {
                    this.substepExtract = '4';
                    this.lauchEvent("Symptoms");
                    Swal.fire(this.translate.instant("phenotype.No symptoms found"), '', "warning");
                    this.focusManualSymptoms();
                }

            }, (err) => {
                console.log(err);
                //fail getNoSegmentation
                Swal.close();
            }));
    }

    addTemporalSymptom(symptom, inputType) {
        var foundElement = this.searchService.search(this.temporalSymptoms, 'id', symptom.id);
        if (!foundElement) {
            this.temporalSymptoms.push({ id: symptom.id, name: symptom.name, new: true, checked: null, percentile: -1, inputType: inputType, importance: '1', polarity: '0', similarity: symptom.similarity, positions: symptom.positions, text: symptom.text });
            this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
            return true;
        } else {
            //buscar el sintoma, mirar si tiene mejor prababilidad, y meter la nueva aparicion en posiciones
            var enc = false;
            for (var z = 0; z < this.temporalSymptoms.length && !enc; z++) {
                if (this.temporalSymptoms[z].id == symptom.id && this.temporalSymptoms[z].inputType != "manual") {
                    if(this.temporalSymptoms[z].inputType == "textAnalytics"){
                        this.temporalSymptoms[z].text.push(symptom.text);
                    }else{
                        if (this.temporalSymptoms[z].similarity < symptom.similarity) {
                            this.temporalSymptoms[z].similarity = symptom.similarity;
                        }
                        this.temporalSymptoms[z].positions.push(symptom.positions[0]);
                    }
                    
                    enc = true;
                }
            }
            return false;
        }
    }

    addTemporalSymptomTable(symptom, inputType, index2) {
        var foundElement = this.searchService.search(this.temporalSymptoms, 'id', symptom.id);
        if (!foundElement) {
            this.temporalSymptoms.push({ id: symptom.id, name: symptom.name, new: true, checked: true, percentile: -1, inputType: inputType, importance: '1', polarity: '0', similarity: symptom.similarity, positions: symptom.positions, text: symptom.text });
            this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
        } else {
            var indexElement = this.searchService.searchIndex(this.temporalSymptoms, 'id', symptom.id);
            this.temporalSymptoms[indexElement].checked = true;
        }
        this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[index2].hasPatient = true;
        this.reloadDiseases = true;
        this.lauchEvent("Add symptoms");
        for (var i = 0; i < this.temporalSymptoms.length; i++) {
            if (this.temporalSymptoms[i].checked) {
                this.numberOfSymtomsChecked++;
            }
        }
    }

    showSwal(text) {
        Swal.fire({
            icon: 'success',
            html: text,
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
        })
        setTimeout(function () {
            Swal.close();
        }, 2000);
    }

    deleteSymptom(symptom, index2) {
        var index = -1;
        var found = false;
        for (var i = 0; i < this.temporalSymptoms.length; i++) {
            if (symptom.id == this.temporalSymptoms[i].id) {
                index = i;
                found = true;
                this.confirmDeletePhenotype2(index, index2);
            }
        }
    }

    confirmDeletePhenotype2(index, index2) {
        Swal.fire({
            title: this.translate.instant("generics.Are you sure delete") + " " + this.temporalSymptoms[index].name + " ?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#33658a',
            cancelButtonColor: '#B0B6BB',
            confirmButtonText: this.translate.instant("generics.Accept"),
            cancelButtonText: this.translate.instant("generics.Cancel"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false,
            reverseButtons: true
        }).then((result) => {
            if (result.value) {
                this.temporalSymptoms.splice(index, 1);
                if (this.topRelatedConditions[this.selectedInfoDiseaseIndex] != undefined) {
                    this.topRelatedConditions[this.selectedInfoDiseaseIndex].symptoms[index2].hasPatient = false;
                }
                this.getNumberOfSymptomsChecked(false);
                this.reloadDiseases = true;
                this.lauchEvent("Delete symptoms");
            }
        });

    }

    closeDiseaseUndiagnosed() {
        if (this.modalReference != undefined) {
            this.modalReference.close();
            this.modalReference = undefined;
        }
        if (this.reloadDiseases) {
            this.getNumberOfSymptomsChecked(true);
            this.showSwal(this.translate.instant("land.proposed diseases has been updated"));
        }

    }

    sortBySimilarity() {
        this.temporalSymptoms.sort(this.sortService.GetSortOrderInverse("similarity"));
    }

    callGetInfoTempSymptomsJSON(hposStrins) {
        //this.subscription.add(this.apif29BioService.getInfoSymptomsJSON(hposStrins,this.listOfphenotypesinfo)
        var lang = this.lang;
        this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang, hposStrins)
            .subscribe((res: any) => {

                var tamano = Object.keys(res).length;
                if (tamano > 0) {
                    for (var i in res) {
                        for (var j = 0; j < this.temporalSymptoms.length; j++) {
                            if (res[i].id == this.temporalSymptoms[j].id) {
                                this.temporalSymptoms[j].name = res[i].name;
                                this.temporalSymptoms[j].def = res[i].desc;
                                this.temporalSymptoms[j].synonyms = res[i].synonyms;
                                this.temporalSymptoms[j].comment = res[i].comment;
                                if (this.temporalSymptoms[j].importance == undefined) {
                                    this.temporalSymptoms[j].importance = 1;
                                }
                            }
                        }
                    }
                    this.temporalSymptoms.sort(this.sortService.GetSortOrder("name"));
                }
                this.substepExtract = '4';
                this.lauchEvent("Symptoms");
                if (this.lucky) {
                    this.checkSymptoms();
                } else {
                    this.showSwalSelectSymptoms();
                }
                this.focusManualSymptoms();


            }, (err) => {
                console.log(err);
                this.substepExtract = '4';
                this.lauchEvent("Symptoms");
                this.focusManualSymptoms();
            }));
    }

    showSwalSelectSymptoms() {
        if (this.temporalSymptoms.length == 0) {
            this.inputManualSymptomsElement.nativeElement.focus();
        }
        /*var showSwalSelSymptoms = localStorage.getItem('showSwalSelSymptoms');
        if (showSwalSelSymptoms != 'false') {
            Swal.fire({
                icon: 'warning',
                html: '<p>' + this.translate.instant("land.you have to select") + '</p><p>' + this.translate.instant("land.When you have selected them") + '</p>',
                input: 'checkbox',
                inputPlaceholder: this.translate.instant("land.Do not show this message again"),
                focusConfirm: true
            }).then((result) => {
                if (result.isConfirmed) {
                    if (result.value) {
                        localStorage.setItem('showSwalSelSymptoms', 'false');
                    }
                } else {
                    console.log(`modal was dismissed by ${result.dismiss}`)
                }
                if (this.temporalSymptoms.length == 0) {
                    this.inputManualSymptomsElement.nativeElement.focus();
                }
            })
        }*/

    }

    changeStateSymptom(index) {
        this.temporalSymptoms[index].checked = !this.temporalSymptoms[index].checked;
        this.getNumberOfSymptomsChecked(false);
        /*if(!state){
            this.deleteSymptom(this.temporalSymptoms[index], index);
        }*/
    }

    checkSymptoms() {
        for (var i = 0; i < this.temporalSymptoms.length; i++) {
            this.temporalSymptoms[i].checked = true;
            this.numberOfSymtomsChecked++;
        }
        this.calculate();
    }

    changeLucky() {
        this.lucky = !this.lucky;
    }

    getNumberOfSymptomsChecked(recalculate) {
        this.reloadDiseases = false;
        this.numberOfSymtomsChecked = 0;
        for (var i = 0; i < this.temporalSymptoms.length; i++) {
            if (this.temporalSymptoms[i].checked) {
                this.numberOfSymtomsChecked++;
            }
        }
        if (this.numberOfSymtomsChecked >= this.minSymptoms && this.temporalDiseases.length > 0 && recalculate) {
            this.calculate();
        } else if (this.numberOfSymtomsChecked < this.minSymptoms) {
            if (this.currentStep.stepIndex != 2) {
                this.topRelatedConditions = [];
            } else {
                if (this.modalReference != undefined) {
                    this.modalReference.close();
                    this.modalReference = undefined;
                }
                Swal.fire(this.translate.instant("land.remembertitle"), this.translate.instant("land.remember"), "error");
                this.currentStep = this.steps[0];
            }
        }
    }

    showMoreInfoSymptomPopup(symptomIndex, contentInfoSymptomNcr) {
        this.ncrResultView = false;
        this.selectedInfoSymptomIndex = symptomIndex;
        let ngbModalOptions: NgbModalOptions = {
            keyboard: false,
            windowClass: 'ModalClass-sm'// xl, lg, sm
        };
        this.modalReference4 = this.modalService.open(contentInfoSymptomNcr, ngbModalOptions);
    }

    calculate() {

        if (this.numberOfSymtomsChecked >= this.minSymptoms) {
            this.topRelatedConditions = [];
            this.temporalDiseases = [];
            this.indexListRelatedConditions = this.showNumerRelatedConditions;
            this.loadingCalculate = true;
            var info = {
                "symptoms": []
            }
            for (var index in this.temporalSymptoms) {
                if (this.temporalSymptoms[index].checked) {
                    info.symptoms.push(this.temporalSymptoms[index].id);
                }
            }
            var lang = this.lang;
            this.subscription.add(this.apiDx29ServerService.calculate(info, lang)
                .subscribe((res: any) => {
                    if (res == null) {
                        this.calculate()
                    } else {
                        if (res.length == 0) {
                            this.loadingCalculate = false;
                            Swal.fire(this.translate.instant("land.we have not found any disease"), this.translate.instant("land.Please try again adding more symptoms"), "error");
                        } else {
                            this.temporalDiseases = res;
                            var listOfDiseases = [];
                            res.forEach(function (element) {
                                listOfDiseases.push(element.id);
                            });
                            this.getInfoDiseases(listOfDiseases);
                        }

                    }
                }));
        } else {
            if (this.temporalSymptoms.length < this.minSymptoms) {
                Swal.fire(this.translate.instant("land.remembertitle"), this.translate.instant("land.remember"), "error");
                this.loadingCalculate = false;
            } else {
                Swal.fire(this.translate.instant("land.remembertitle"), this.translate.instant("land.remember"), "error");
                this.loadingCalculate = false;
            }

        }

    }

    getInfoDiseases(listOfDiseases) {
        var lang = this.lang;
        this.subscription.add(this.apif29BioService.getInfoOfDiseasesLang(listOfDiseases, lang)
            .subscribe((res1: any) => {
                for (var i = 0; i < this.temporalDiseases.length; i++) {
                    var valtemp = this.temporalDiseases[i].id;
                    if (res1[valtemp] != undefined) {
                        //this.temporalDiseases[i].name = res1[valtemp].name;
                        //this.temporalDiseases[i].id = res1[valtemp].id;
                        if (res1[valtemp].desc != "") {
                            this.temporalDiseases[i].desc = res1[valtemp].desc;
                        } else if (res1[valtemp].comment != "") {
                            this.temporalDiseases[i].desc = res1[valtemp].comment;
                        }
                        this.temporalDiseases[i].xRefs = res1[valtemp].xrefs;
                    } else {
                        //this.temporalDiseases[i].name = this.temporalDiseases[i].id;
                    }
                }
                this.cleanDiseases();
                this.totalDiseasesLeft = this.temporalDiseases.length - this.showNumerRelatedConditions;
                this.topRelatedConditions = this.temporalDiseases.slice(0, this.indexListRelatedConditions)
                this.loadingCalculate = false;
                this.lauchEvent("Diseases");
                this.isFirstCalculate = false;
                this.saveSymptomsSession();

                if (this.currentStep.stepIndex == 2) {
                    if (this.isFirstCalculate) {
                        this.toastr.success('', this.translate.instant("land.The list of proposed diseases is now available"));
                    } else {
                        this.toastr.success('', this.translate.instant("land.The list of proposed diseases has been updated"));
                    }
                } else {
                    this.goNext();
                }




            }, (err) => {
                console.log(err);
                this.loadingCalculate = false;
            }));
    }

    cleanDiseases() {
        for (var i = 0; i < this.temporalDiseases.length; i++) {
            var actualDisease = this.temporalDiseases[i];
            if (actualDisease.xRefs != undefined) {
                if (actualDisease.xRefs.length == 0) {
                    actualDisease.xRefs.push(actualDisease.id);
                }
                actualDisease.xRefs.sort((one, two) => (one > two ? -1 : 1));
                var xrefs = this.cleanOrphas(actualDisease.xRefs)
                this.temporalDiseases[i].xRefs = xrefs;
            }
            this.temporalDiseases[i].name = this.textTransform.transform(actualDisease.name);
        }
    }

    cleanOrphas(xrefs) {
        var res = [];
        var count = 0;
        for (var i = 0; i < xrefs.length; i++) {
            if (xrefs[i].indexOf('ORPHA') != -1 || xrefs[i].indexOf('ORPHANET') != -1 || xrefs[i].indexOf('OMIM') != -1) {
                if (xrefs[i].indexOf('ORPHA') != -1 || xrefs[i].indexOf('ORPHANET') != -1) {
                    count++;
                }
                if (count <= 1) {
                    var value = xrefs[i].split(':');
                    if (xrefs[i].indexOf('ORPHA') != -1 || xrefs[i].indexOf('ORPHANET') != -1) {
                        res.push({ name: 'Orphanet', id: value[1] });
                    } else if (xrefs[i].indexOf('OMIM') != -1) {
                        res.push({ name: 'OMIM', id: value[1] });
                    }
                    count++;
                }
            }
        }
        return res;
    }

    restartAllVars() {
        this.indexListRelatedConditions = this.showNumerRelatedConditions;
        //this.temporalSymptoms = [];
        this.numberOfSymtomsChecked = 0;
        this.topRelatedConditions = [];
        this.temporalDiseases = [];
    }

    restartInitVars() {
        this.temporalSymptoms = [];
        this.medicalText = '';
        this.substepExtract = '0';
        this.restartAllVars();
        this.focusTextArea();
    }

    getPlainInfoSymptoms() {
        var resCopy = "";
        for (let i = 0; i < this.temporalSymptoms.length; i++) {
            if (this.temporalSymptoms[i].checked) {
                resCopy = resCopy + this.temporalSymptoms[i].id + " - " + this.temporalSymptoms[i].name;
                if (i + 1 < this.temporalSymptoms.length) {
                    resCopy = resCopy + "\n";
                }
            }
        }
        return resCopy;
    }

    getPlainInfoSymptoms2() {
        var resCopy = "";
        for (let i = 0; i < this.temporalSymptoms.length; i++) {
            if (this.temporalSymptoms[i].checked) {
                resCopy = resCopy + this.temporalSymptoms[i].id + " - " + this.temporalSymptoms[i].name;
                if (i + 1 < this.temporalSymptoms.length) {
                    resCopy = resCopy + "\n";
                }
            }
        }
        return resCopy;
    }

    copySymptoms() {
        var infoSymptoms = this.getPlainInfoSymptoms();
        if (infoSymptoms != "") {
            this.clipboard.copy(this.getPlainInfoSymptoms());
            Swal.fire({
                icon: 'success',
                html: this.translate.instant("land.Symptoms copied to the clipboard"),
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false
            })
            setTimeout(function () {
                Swal.close();
            }, 2000);
            this.lauchEvent("Copy symptoms");

        } else {
            Swal.fire(this.translate.instant("land.To be able to copy the symptoms"), '', "warning");
        }
    }

    downloadSymptoms() {
        var infoSymptoms = this.getCheckedSymptoms();
        if (infoSymptoms.length != 0) {
            var infoSymptoms = this.getCheckedSymptoms();
            var infoDiseases = [];//this.getPlainInfoDiseases();
            this.jsPDFService.generateResultsPDF(infoSymptoms, infoDiseases, this.lang)
        } else {
            Swal.fire(this.translate.instant("land.In order to download the symptoms"), '', "warning");
        }
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

    }

    deleteDisease(disease, index2) {
        var index = -1;
        var found = false;
        for (var i = 0; i < this.topRelatedConditions.length; i++) {
            if (disease == this.topRelatedConditions[i]) {
                index = i;
                found = true;
                this.confirmDeleteDisease(index, index2);
            }
        }
    }

    confirmDeleteDisease(index, index2) {
        Swal.fire({
            title: this.translate.instant("generics.Are you sure delete") + " " + this.topRelatedConditions[index] + " ?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#33658a',
            cancelButtonColor: '#B0B6BB',
            confirmButtonText: this.translate.instant("generics.Accept"),
            cancelButtonText: this.translate.instant("generics.Cancel"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false,
            reverseButtons: true
        }).then((result) => {
            if (result.value) {
                this.topRelatedConditions.splice(index, 1);
                this.lauchEvent("Delete disease");
            }
        });

    }

    getCheckedSymptoms() {
        var resCopy = [];
        for (let i = 0; i < this.temporalSymptoms.length; i++) {
            if (this.temporalSymptoms[i].checked) {
                if (this.temporalSymptoms[i].def != null) {
                    this.temporalSymptoms[i].desc = this.temporalSymptoms[i].def;
                }
                resCopy.push(this.temporalSymptoms[i]);
            }
        }
        return resCopy;
    }

    copyResults() {
        var finalReport = "";
        var infoDiseases = this.getPlainInfoDiseases2();
        finalReport = this.translate.instant("land.diagnosed.general.Symptoms");
        if (infoDiseases != "") {
            finalReport = finalReport + "\n \n" + this.translate.instant("diagnosis.Proposed diagnoses") + "\n" + infoDiseases;
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
        var infoSymptoms = this.getCheckedSymptoms();
        var infoDiseases = this.getPlainInfoDiseases();
        this.jsPDFService.generateResultsPDF([], infoDiseases, this.lang)
    }

    getPlainInfoDiseases() {
        var resCopy = [];
        for (let i = 0; i < this.topRelatedConditions.length; i++) {
            resCopy.push({ name: this.topRelatedConditions[i]});
        }
        return resCopy;
    }

    getPlainInfoSymptomsEmail() {
        var resCopy = "";
        for (let i = 0; i < this.temporalSymptoms.length; i++) {
            if (this.temporalSymptoms[i].checked) {
                resCopy = resCopy + this.temporalSymptoms[i].name + " - " + '<a href="https://hpo.jax.org/app/browse/term/' + this.temporalSymptoms[i].id + '">' + this.temporalSymptoms[i].id + '</a>';
                if (i + 1 < this.temporalSymptoms.length) {
                    resCopy = resCopy + " <br> ";
                }
            }
        }
        return resCopy;
    }

    getPlainInfoDiseasesEmail() {
        var resCopy = "";
        for (let i = 0; i < this.topRelatedConditions.length; i++) {
            var value = this.topRelatedConditions[i].id.split(':');
            resCopy = resCopy + this.topRelatedConditions[i].name + " - " + '<a href="https://www.orpha.net/consor/cgi-bin/OC_Exp.php?Expert=' + value[1] + '&lng=' + this.lang + '">' + this.topRelatedConditions[i].id + '</a>';
            if (i + 1 < this.topRelatedConditions.length) {
                resCopy = resCopy + " <br> ";
            }
        }
        return resCopy;
    }

    getFormatDate(date) {
        var localeLang = 'en-US';
        if (this.lang == 'es') {
            localeLang = 'es-ES'
        }
        var optionsdate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleString(localeLang, optionsdate);
    }

    getLiteral(literal) {
        return this.translate.instant(literal);
    }

    showCompleteNcrResultView(symptom, method) {
        this.ncrResultView = !this.ncrResultView;
        if (symptom != null) {
            if(method=='ncr'){
                this.markAllText(symptom)
            }else if(method=='textAnalytics'){
                this.markAllTextAnalytics(symptom)
            }
            
        }
    }

    showCompleteNcrOldResultView(symptom) {
        this.ncrResultView = !this.ncrResultView;
        if (symptom != null) {
            this.markText(this.resultTextNcr, symptom.positions[0][0], symptom.positions[0][1]);
        }
    }

    markText(text, pos1, pos2) {
        this.ncrResultView = true;
        this.searchTerm = text.substring(pos1, pos2);
        this.resultTextNcrCopy = this.highlightSearch.transform(this.resultTextNcr, this.searchTerm);
        this.showScrollButton();
    }

    markAllText(symptom) {
        this.resultTextNcrCopy = this.medicalText;
        var text = symptom.text[0].text;
        if (this.langToExtract != 'en' || this.langDetected != 'en') {
            text = symptom.text[0].source;
            this.resultTextNcrCopy = this.highlightSearch.transform(this.resultTextNcr, text);
        } else {
            var hpo = symptom;
            var words = [];
            for (var j = 0; j < hpo.positions.length; j++) {
                var value = text.substring(hpo.positions[j][0], hpo.positions[j][1]);
                words.push({ args: value })
            }
            this.resultTextNcrCopy = this.highlightSearch.transformAll(this.resultTextNcr, words);
        }
        this.showScrollButton();
    }

    markAllTextAnalytics(symptom) {
        this.resultTextNcrCopy = this.medicalText;
        var text = symptom.text[0].text;
        if (this.langToExtract != 'en' || this.langDetected != 'en') {
            text = symptom.text[0].source;
            /*text = symptom.text[0].source;
            this.resultTextNcrCopy = this.highlightSearch.transform(this.resultTextNcr, text);*/
            var hpo = symptom;
            var words = [];
            console.log(hpo);
            for (var j = 0; j < hpo.text.length; j++) {
                if(hpo.text[j].positions!=undefined){
                    var value = text.substring(hpo.text[j].positions[0], hpo.text[j].positions[1]);
                    console.log(value);
                    words.push({ args: value })
                }
                
            }
            this.resultTextNcrCopy = this.highlightSearch.transformAll(this.resultTextNcr, words);
        } else {
            var hpo = symptom;
            var words = [];
            console.log(hpo);
            for (var j = 0; j < hpo.text.length; j++) {
                if(hpo.text[j].positions!=undefined){
                    var value = text.substring(hpo.text[j].positions[0], hpo.text[j].positions[1]);
                    console.log(value);
                    words.push({ args: value })
                }
                
            }
            this.resultTextNcrCopy = this.highlightSearch.transformAll(this.resultTextNcr, words);
        }
        this.showScrollButton();
    }

    showScrollButton() {
        setTimeout(() => {
            var el = document.getElementsByClassName("actualPosition")[0];
            if (el != undefined) {
                el.scrollIntoView(true);
                var height = document.getElementById('idBody').offsetHeight;
                var docHeight = $(document).height();
                if (height > docHeight) {
                    this.showButtonScroll = true;
                    this.myFunction();
                } else {
                    this.showButtonScroll = false;
                }
            }
        }, 100);
    }

    closeModal() {
        document.getElementsByClassName("ModalClass-sm")[0].removeEventListener("scroll", this.myFunction);
        if (this.modalReference4 != undefined) {
            this.modalReference4.close();
            this.modalReference4 = undefined;
        }
    }

    myFunction() {
        document.getElementsByClassName("ModalClass-sm")[0]
            .addEventListener('scroll', function () {
                var height = document.getElementById('idBody').offsetHeight;
                var docHeight = $(document).height();
                var sizeele = $(".ModalClass-sm").scrollTop();
                if (height > docHeight) {
                    if (sizeele <= (docHeight / 2)) {
                        this.showButtonScroll = false;
                    } else {
                        this.showButtonScroll = true;
                    }
                } else {
                    this.showButtonScroll = false;
                }
            }.bind(this));
    }

    goToTop() {
        setTimeout(() => {
            var el = document.getElementsByClassName("modal-header")[0];
            el.scrollIntoView(true);
        }, 100);
    }

    onFileDropped(event) {
        var reader = new FileReader();
        reader.readAsDataURL(event[0]); // read file as data url
        reader.onload = (event2: any) => { // called once readAsDataURL is completed
            var the_url = event2.target.result
            var extension = (event[0]).name.substr((event[0]).name.lastIndexOf('.'));
            extension = extension.toLowerCase();
            this.langToExtract = '';
            this.optionSymptomAdded = "File";
            if (event[0].type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension == '.docx') {
                this.loadFile(the_url, function (err, content) {
                    if (err) { console.log(err); };
                    var doc = new Docxgen(content);
                    var text = doc.getFullText();
                    this.detectLanguage(text, 'otherdocs');
                    this.medicalText = text;
                    this.showPanelExtractor = true;
                    this.expanded = true;
                }.bind(this))
            } else if (event[0].type == 'application/pdf' || extension == '.pdf' || extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif') {
                this.parserObject.file = event[0]
                if (extension == '.jpg' || extension == '.png' || extension == '.gif' || extension == '.tiff' || extension == '.tif' || extension == '.bmp' || extension == '.dib' || extension == '.bpg' || extension == '.psd' || extension == '.jpeg' || extension == '.jpe' || extension == '.jfif') {
                    this.parserObject.parserStrategy = 'OcrOnly';
                } else {
                    this.parserObject.parserStrategy = 'OcrOnly';//Auto
                }
                this.callParser();
            } else {
                Swal.fire(this.translate.instant("dashboardpatient.error extension"), '', "error");
            }

        }
    }

    registerToDx29V2() {
        this.lauchEvent("Registration");
        this.lauchEvent("Registration Power Undiagnosed - Event");
        if (this.modalReference3 != undefined) {
            this.modalReference3.close();
            this.modalReference3 = undefined;
        }
        this.setSymptomsParams();
    }

    setSymptomsParams() {
        var info = {
            "Symptoms": []
        }
        for (var index in this.temporalSymptoms) {
            if (this.temporalSymptoms[index].checked) {
                info.Symptoms.push({ "Id": this.temporalSymptoms[index].id, "StartDate": null, "EndDate": null, "IsCurrent": false, "Notes": null });
            }
        }
        if (info.Symptoms.length > 0) {
            this.subscription.add(this.apiDx29ServerService.createblobOpenDx29(info)
                .subscribe((res: any) => {
                    sessionStorage.removeItem('symptoms');
                    sessionStorage.removeItem('uuid');
                    if (res.message == 'Done') {
                        window.location.href = environment.urlDxv2 + "/Identity/Account/Register?opendata=" + res.token;
                    } else {
                        window.location.href = environment.urlDxv2 + "/Identity/Account/Register";
                    }
                }));
        } else {
            window.location.href = environment.urlDxv2 + "/Identity/Account/Register";
        }
    }

    goto(url) {
        document.getElementById(url).scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }

    saveSymptomsSession() {
        var info = {
            "Symptoms": []
        }
        for (var index in this.temporalSymptoms) {
            if (this.temporalSymptoms[index].checked) {
                info.Symptoms.push({ "Id": this.temporalSymptoms[index].id, "StartDate": null, "EndDate": null, "IsCurrent": false, "Notes": null })
            }
        }
        sessionStorage.setItem('symptoms', JSON.stringify(info));
    }

    directCalculate() {
        if (this.temporalSymptoms.length >= this.minSymptoms) {
            this.medicalText = '';
            for(var index in this.temporalSymptoms){
                if(this.temporalSymptoms[index].checked){
                    this.medicalText += this.temporalSymptoms[index].name + ' ';
                }
            }
            this.callOpenAi();
        } else {
            Swal.fire(this.translate.instant("land.remembertitle"), this.translate.instant("land.remember"), "error");
            this.loadingCalculate = false;
        }

    }

    selectRole() {
        this.router.navigate(['/']);
    }

    searchSymptoms: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            tap(() => this.callListOfSymptoms = true),
            switchMap(term =>
                this.searchTermService.search(term).pipe(
                    tap(() => this.nothingFoundSymptoms = false),
                    catchError(() => {
                        this.nothingFoundSymptoms = true;
                        return of([]);
                    }))
            ),
            tap(() => this.callListOfSymptoms = false)
        )

    closeSymptom() {
        if (this.modalReference4 != undefined) {
            this.modalReference4.close();
            this.modalReference4 = undefined;
        }
    }

    focusOutFunctionSymptom() {
        if (this.showErrorMsg && this.modelTemp.length > 2) {
            this.sendSympTerms = true;
            var params: any = {}
            params.uuid = this.myuuid;
            params.Term = this.modelTemp;
            params.Lang = sessionStorage.getItem('lang');
            var d = new Date(Date.now());
            var a = d.toString();
            params.Date = a;
            this.subscription.add(this.http.post('https://prod-112.westeurope.logic.azure.com:443/workflows/95df9b0148cf409f9a8f2b0853820beb/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OZyXnirC5JTHpc_MQ5IwqBugUqI853qek4o8qjNy7AA', params)
                .subscribe((res: any) => {
                }, (err) => {
                }));

        }
        this.modelTemp = '';
        this.callListOfSymptoms = false;
    }

    closeRegisterPanel() {
        if (this.modalReference3 != undefined) {
            this.modalReference3.close();
            this.modalReference3 = undefined;
        }
    }
}
