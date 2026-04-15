import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EventsService} from 'app/shared/services/events.service';
import { Injector } from '@angular/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { UuidService } from 'app/shared/services/uuid.service';
declare let gtag: any;
  
@Component({
    selector: 'app-feedback-page',
    templateUrl: './feedback-page.component.html',
    styleUrls: ['./feedback-page.component.scss'],
    standalone: false
})

export class FeedbackPageComponent implements OnDestroy {

    private subscription: Subscription = new Subscription();
    _startTime: any;
    role: string = '';
    myuuid: string;
    email: string = '';
    showErrorForm: boolean = false;
    sending: boolean = false;
    terms2: boolean = false;
    @ViewChild('f') mainForm: NgForm;
    moreFunctLength: number = 0;
    freeTextLength: number = 0;
    formulario: FormGroup;
    healthcareSpecialtyOptions: Array<{ value: string; i18nKey: string }> = [
      { value: 'Cardiology', i18nKey: 'cardiology' },
      { value: 'Clinical Genetics', i18nKey: 'clinicalGenetics' },
      { value: 'Dermatology', i18nKey: 'dermatology' },
      { value: 'Emergency Medicine', i18nKey: 'emergencyMedicine' },
      { value: 'Endocrinology', i18nKey: 'endocrinology' },
      { value: 'Family Medicine', i18nKey: 'familyMedicine' },
      { value: 'Gastroenterology', i18nKey: 'gastroenterology' },
      { value: 'General Surgery', i18nKey: 'generalSurgery' },
      { value: 'Gynecology and Obstetrics', i18nKey: 'gynecologyAndObstetrics' },
      { value: 'Hematology', i18nKey: 'hematology' },
      { value: 'Infectious Diseases', i18nKey: 'infectiousDiseases' },
      { value: 'Intensive Care Medicine', i18nKey: 'intensiveCareMedicine' },
      { value: 'Internal Medicine', i18nKey: 'internalMedicine' },
      { value: 'Medical Oncology', i18nKey: 'medicalOncology' },
      { value: 'Nephrology', i18nKey: 'nephrology' },
      { value: 'Neurology', i18nKey: 'neurology' },
      { value: 'Neurosurgery', i18nKey: 'neurosurgery' },
      { value: 'Ophthalmology', i18nKey: 'ophthalmology' },
      { value: 'Orthopedic Surgery and Traumatology', i18nKey: 'orthopedicSurgeryAndTraumatology' },
      { value: 'Otolaryngology', i18nKey: 'otolaryngology' },
      { value: 'Pediatrics', i18nKey: 'pediatrics' },
      { value: 'Psychiatry', i18nKey: 'psychiatry' },
      { value: 'Pulmonology', i18nKey: 'pulmonology' },
      { value: 'Radiology', i18nKey: 'radiology' },
      { value: 'Rheumatology', i18nKey: 'rheumatology' },
      { value: 'Urology', i18nKey: 'urology' },
      { value: 'Other', i18nKey: 'other' },
      { value: 'Prefer not to say', i18nKey: 'preferNotToSay' }
    ];
    localizedHealthcareSpecialtyOptions: Array<{ value: string; i18nKey: string }> = [];
    
    // Nuevos parámetros recibidos
    model: string = '';
    fileNames: string = '';
    isBetaPage: boolean = false;
    suggestionAppliedBySystem: boolean = false;
    inferredTopSpecialties: string[] = [];
    inferredSuggestedUserType: string = '';
    inferredFeedbackAutofillRecommended: boolean = false;
    inferredConfidence: number | null = null;
    inferredConfidenceThreshold: number | null = null;
    inferredSelectedViaPill: boolean = false;
    inferredPillClicks: number = 0;
    inferredAutofilledUserType: string = '';
    inferredAutofilledSpecialty: string = '';

    constructor(public translate: TranslateService, private http: HttpClient, public activeModal: NgbActiveModal, private inj: Injector, public insightsService: InsightsService, private eventsService: EventsService, private uuidService: UuidService) {
        this._startTime = Date.now();
        this.myuuid = this.uuidService.getUuid();
        
        // Los parámetros se pasarán a través del modal service
        // Se inicializarán desde el componente padre
        

        this.formulario = new FormGroup({
            pregunta1: new FormControl('', Validators.required), // Definir los controles del formulario
            pregunta2: new FormControl('', Validators.required),
            userType: new FormControl('', Validators.required),
            healthcareSpecialty: new FormControl(''),
            moreFunct: new FormControl(''),
            freeText: new FormControl(''),
            email: new FormControl('', [Validators.email]),
            terms2: new FormControl('')
          });

          this.moreFunctLength = this.formulario.get('moreFunct').value.length;
          this.freeTextLength = this.formulario.get('freeText').value.length;
          this.updateHealthcareSpecialtyValidation(this.formulario.get('userType')?.value);
          const userTypeControl = this.formulario.get('userType');
          if (userTypeControl) {
            this.subscription.add(
              userTypeControl.valueChanges.subscribe((userType: string) => {
                this.updateHealthcareSpecialtyValidation(userType);
              })
            );
          }
          this.sortHealthcareSpecialtyOptionsByLocale();
          this.subscription.add(
            this.translate.onLangChange.subscribe(() => {
              this.sortHealthcareSpecialtyOptionsByLocale();
            })
          );

          setTimeout(function () {
            //this.goTo('initpos');
        }.bind(this), 500);

        this.subscription.add(this.eventsService.on('backEvent', () => {
            this.activeModal.close('Close click');
          }));

    }

    onInput(event: Event, controlName: string): void {
        const inputElement = event.target as HTMLTextAreaElement;
        if (controlName === 'moreFunct') {
          this.moreFunctLength = inputElement.value.length;
        } else if (controlName === 'freeText') {
          this.freeTextLength = inputElement.value.length;
        }
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }

      goTo(url){
        document.getElementById(url).scrollIntoView(true);
      }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        try {
          if (typeof gtag === 'function') {
            gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
          }
        } catch (error) {
          this.insightsService.trackException(error);
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    openWeb(){
        window.open('https://www.foundation29.org', '_blank');
    }

    private updateHealthcareSpecialtyValidation(userType: string): void {
      const healthcareSpecialtyControl = this.formulario.get('healthcareSpecialty');
      if (!healthcareSpecialtyControl) {
        return;
      }

      // Especialidad opcional: solo se limpia si no es profesional sanitario.
      healthcareSpecialtyControl.clearValidators();
      if (userType !== 'professional') {
        healthcareSpecialtyControl.setValue('');
      }

      healthcareSpecialtyControl.updateValueAndValidity({ emitEvent: false });
    }

    private sortHealthcareSpecialtyOptionsByLocale(): void {
      const lastValues = new Set(['Other', 'Prefer not to say']);
      const locale = this.translate?.currentLang || this.translate?.store?.currentLang || 'en';

      const mainOptions = this.healthcareSpecialtyOptions
        .filter(option => !lastValues.has(option.value))
        .slice()
        .sort((a, b) => {
          const labelA = this.translate.instant(`feedback.specialtyOptions.${a.i18nKey}`);
          const labelB = this.translate.instant(`feedback.specialtyOptions.${b.i18nKey}`);
          return labelA.localeCompare(labelB, locale);
        });

      const trailingOptions = this.healthcareSpecialtyOptions.filter(option => lastValues.has(option.value));
      this.localizedHealthcareSpecialtyOptions = [...mainOptions, ...trailingOptions];
    }

    getSpecialtyI18nKeyByValue(value: string): string {
      const match = this.healthcareSpecialtyOptions.find(option => option.value === value);
      return match ? match.i18nKey : 'other';
    }

    selectSuggestedSpecialty(specialty: string): void {
      this.formulario.patchValue({
        userType: 'professional',
        healthcareSpecialty: specialty
      });
      this.suggestionAppliedBySystem = false;
      this.inferredSelectedViaPill = true;
      this.inferredPillClicks += 1;
      this.insightsService.trackEvent('feedback_suggestion_pill_click', {
        myuuid: this.myuuid,
        specialty,
        model: this.model,
        isBetaPage: this.isBetaPage
      });
    }

    getAlternativeSuggestedSpecialties(): string[] {
      const selectedSpecialty = this.formulario.get('healthcareSpecialty')?.value;
      return this.inferredTopSpecialties.filter(specialty => specialty !== selectedSpecialty).slice(0, 3);
    }

    private buildInferenceMeta(finalUserType: string, finalHealthcareSpecialty: string) {
      const suggestedUserType = this.inferredSuggestedUserType || null;
      const suggestedTopSpecialties = this.inferredTopSpecialties.slice(0, 3);
      const hasSuggestions = !!suggestedUserType || suggestedTopSpecialties.length > 0;

      const selectedIndex = suggestedTopSpecialties.indexOf(finalHealthcareSpecialty);
      const selectedFromTop3 = selectedIndex >= 0;
      const selectedTop3Rank = selectedFromTop3 ? selectedIndex + 1 : null;

      const changedUserType = suggestedUserType ? finalUserType !== suggestedUserType : false;
      const changedPrimarySpecialty = suggestedTopSpecialties.length > 0
        ? finalHealthcareSpecialty !== suggestedTopSpecialties[0]
        : false;

      const changedAfterAutofill = !!this.inferredAutofilledUserType || !!this.inferredAutofilledSpecialty
        ? finalUserType !== this.inferredAutofilledUserType || finalHealthcareSpecialty !== this.inferredAutofilledSpecialty
        : false;

      return {
        hasSuggestions,
        suggestedUserType,
        suggestedTopSpecialties,
        feedbackAutofillRecommended: this.inferredFeedbackAutofillRecommended,
        confidence: this.inferredConfidence,
        confidenceThreshold: this.inferredConfidenceThreshold,
        autofillApplied: !!this.inferredAutofilledUserType || !!this.inferredAutofilledSpecialty,
        autofilledUserType: this.inferredAutofilledUserType || null,
        autofilledHealthcareSpecialty: this.inferredAutofilledSpecialty || null,
        finalUserType,
        finalHealthcareSpecialty: finalHealthcareSpecialty || null,
        changedUserType,
        changedPrimarySpecialty,
        changedAfterAutofill,
        selectedFromTop3,
        selectedTop3Rank,
        selectedViaSuggestedPill: this.inferredSelectedViaPill,
        suggestedPillClicks: this.inferredPillClicks
      };
    }
  
      sendFeedback(){
        if (this.formulario.valid) {
          this.sending = true;
          const rawHealthcareSpecialty = this.formulario.get('healthcareSpecialty')?.value;
          const healthcareSpecialty = (rawHealthcareSpecialty || '').trim();
          const finalUserType = this.formulario.get('userType')?.value || '';
          const inferenceMeta = this.buildInferenceMeta(finalUserType, healthcareSpecialty);
          const feedbackFormValue = { ...this.formulario.value };
          delete feedbackFormValue.healthcareSpecialty;
      
          //this.mainForm.value.email = (this.mainForm.value.email).toLowerCase();
          //this.mainForm.value.lang=this.translate.store.currentLang;
          var value = { 
            value: feedbackFormValue, 
            healthcareSpecialty,
            inferenceMeta,
            myuuid: this.myuuid, 
            lang: this.translate.store.currentLang,
            model: this.model,
            fileNames: this.fileNames,
            isBetaPage: this.isBetaPage
          }
          this.insightsService.trackEvent('feedback_inference_submit', {
            myuuid: this.myuuid,
            model: this.model,
            isBetaPage: this.isBetaPage,
            finalUserType: inferenceMeta.finalUserType,
            selectedFromTop3: inferenceMeta.selectedFromTop3,
            selectedTop3Rank: inferenceMeta.selectedTop3Rank,
            changedUserType: inferenceMeta.changedUserType,
            changedPrimarySpecialty: inferenceMeta.changedPrimarySpecialty,
            changedAfterAutofill: inferenceMeta.changedAfterAutofill,
            selectedViaSuggestedPill: inferenceMeta.selectedViaSuggestedPill
          });
          this.subscription.add( this.http.post(environment.api+'/internal/generalfeedback/', value)
          .subscribe( (res : any) => {
            this.sending = false;
            Swal.fire({
                icon: 'success',
                html: this.translate.instant('feedback.thanks'),
                title: this.translate.instant('feedback.Submitted'),
                showConfirmButton: true,
                allowOutsideClick: false
              });
            // Limpie el formulario después de enviar
            this.formulario.reset();
            this.freeTextLength = 0;
            this.moreFunctLength = 0;
            this.lauchEvent('Send email GENERAL FEEDBACK');
            this.activeModal.close();
           }, (err) => {
            this.insightsService.trackException(err);
             console.log(err);
             this.sending = false;
             if (err.error.message === 'Invalid request format or content') {
                const msgError = this.translate.instant("generics.Invalid request format or content");
                Swal.fire({
                    icon: 'error',
                    html: msgError,
                    showCancelButton: false,
                    showConfirmButton: true,
                    allowOutsideClick: false
                });
            } else {
                const msgError = this.translate.instant('generics.error try again');
                Swal.fire({
                    icon: 'error',
                    html: msgError,
                    showCancelButton: false,
                    showConfirmButton: true,
                    allowOutsideClick: false
                });
            }
             
           }));
        } else {
            if (this.formulario.get('email') && this.formulario.get('email').invalid ) {
                Swal.fire({
                    icon: 'error',
                    html: this.translate.instant("generics.entervalidemail"),
                    showCancelButton: false,
                    showConfirmButton: true,
                    allowOutsideClick: false
                })
            } else if (!this.formulario.get('userType')?.value) {
                Swal.fire({
                    icon: 'error',
                    html: this.translate.instant("feedback.selectusertype"),
                    showCancelButton: false,
                    showConfirmButton: true,
                    allowOutsideClick: false
                })
            } else {
                Swal.fire({
                    icon: 'error',
                    html: this.translate.instant("feedback.onstarts"),
                    showCancelButton: false,
                    showConfirmButton: true,
                    allowOutsideClick: false
                })
            }
        } 
      }


    changeTerm($event){
        if ($event.checked) {
            localStorage.setItem('showFeedbackDxGPT', 'true')
        } else {
            localStorage.setItem('showFeedbackDxGPT', 'false')
        }
    }

    showOptions() {
        this.terms2 = !this.terms2;
        if (this.terms2) {
            localStorage.setItem('showFeedbackDxGPT', 'true')
        } else {
            localStorage.setItem('showFeedbackDxGPT', 'false')
        }
    }

    // Métodos públicos para establecer los parámetros desde el componente padre
    setModel(model: string): void {
        this.model = model;
    }

    setSelectedFiles(fileNames: string): void {
        this.fileNames = fileNames;
    }

    setIsBetaPage(isBetaPage: boolean): void {
        this.isBetaPage = isBetaPage;
    }

    setInferredProfile(inferredProfile: any): void {
        if (!inferredProfile || typeof inferredProfile !== 'object') {
          return;
        }

        const inferredUserType = inferredProfile.userType === 'doctor' ? 'professional' : inferredProfile.userType;
        const feedbackAutofillRecommended = inferredProfile.feedbackAutofillRecommended === true;
        this.inferredSuggestedUserType = inferredUserType || '';
        this.inferredFeedbackAutofillRecommended = feedbackAutofillRecommended;
        this.inferredConfidence = Number.isFinite(Number(inferredProfile.confidence)) ? Number(inferredProfile.confidence) : null;
        this.inferredConfidenceThreshold = Number.isFinite(Number(inferredProfile.confidenceThreshold)) ? Number(inferredProfile.confidenceThreshold) : null;
        const topSpecialties = Array.isArray(inferredProfile.topSpecialties) ? inferredProfile.topSpecialties : [];
        const topCatalogSpecialties = topSpecialties.filter((specialty: string) =>
          this.healthcareSpecialtyOptions.some(option => option.value === specialty)
        );
        this.inferredTopSpecialties = topCatalogSpecialties.slice(0, 3);

        if (!feedbackAutofillRecommended || inferredUserType !== 'professional') {
          return;
        }

        this.formulario.patchValue({ userType: inferredUserType });
        if (this.inferredTopSpecialties[0]) {
          this.formulario.patchValue({ healthcareSpecialty: this.inferredTopSpecialties[0] });
          this.inferredAutofilledUserType = inferredUserType;
          this.inferredAutofilledSpecialty = this.inferredTopSpecialties[0];
          this.suggestionAppliedBySystem = true;
        }
    }

}
