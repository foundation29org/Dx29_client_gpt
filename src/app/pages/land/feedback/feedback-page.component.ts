import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
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
      { value: 'Family Medicine', i18nKey: 'familyMedicine' },
      { value: 'Internal Medicine', i18nKey: 'internalMedicine' },
      { value: 'Pediatrics', i18nKey: 'pediatrics' },
      { value: 'Neurology', i18nKey: 'neurology' },
      { value: 'Cardiology', i18nKey: 'cardiology' },
      { value: 'Pulmonology', i18nKey: 'pulmonology' },
      { value: 'Gastroenterology', i18nKey: 'gastroenterology' },
      { value: 'Endocrinology', i18nKey: 'endocrinology' },
      { value: 'Nephrology', i18nKey: 'nephrology' },
      { value: 'Rheumatology', i18nKey: 'rheumatology' },
      { value: 'Hematology', i18nKey: 'hematology' },
      { value: 'Medical Oncology', i18nKey: 'medicalOncology' },
      { value: 'Infectious Diseases', i18nKey: 'infectiousDiseases' },
      { value: 'Dermatology', i18nKey: 'dermatology' },
      { value: 'Psychiatry', i18nKey: 'psychiatry' },
      { value: 'General Surgery', i18nKey: 'generalSurgery' },
      { value: 'Orthopedic Surgery and Traumatology', i18nKey: 'orthopedicSurgeryAndTraumatology' },
      { value: 'Neurosurgery', i18nKey: 'neurosurgery' },
      { value: 'Urology', i18nKey: 'urology' },
      { value: 'Gynecology and Obstetrics', i18nKey: 'gynecologyAndObstetrics' },
      { value: 'Ophthalmology', i18nKey: 'ophthalmology' },
      { value: 'Otolaryngology', i18nKey: 'otolaryngology' },
      { value: 'Radiology', i18nKey: 'radiology' },
      { value: 'Emergency Medicine', i18nKey: 'emergencyMedicine' },
      { value: 'Intensive Care Medicine', i18nKey: 'intensiveCareMedicine' },
      { value: 'Clinical Genetics', i18nKey: 'clinicalGenetics' },
      { value: 'Other', i18nKey: 'other' },
      { value: 'Prefer not to say', i18nKey: 'preferNotToSay' }
    ];
    
    // Nuevos parámetros recibidos
    model: string = '';
    fileNames: string = '';
    isBetaPage: boolean = false;
    showSuggestionBanner: boolean = false;
    suggestionAppliedBySystem: boolean = false;
    suggestionPrimarySpecialty: string = '';
    suggestionAlternativeSpecialties: string[] = [];

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
        gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
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

    getSpecialtyI18nKeyByValue(value: string): string {
      const match = this.healthcareSpecialtyOptions.find(option => option.value === value);
      return match ? match.i18nKey : 'other';
    }

    selectSuggestedSpecialty(specialty: string): void {
      this.formulario.patchValue({
        userType: 'professional',
        healthcareSpecialty: specialty
      });
    }

    confirmSuggestion(): void {
      this.showSuggestionBanner = false;
    }

    changeSuggestion(): void {
      this.suggestionAppliedBySystem = false;
      this.showSuggestionBanner = false;
    }

    discardSuggestion(): void {
      if (this.suggestionAppliedBySystem) {
        this.formulario.patchValue({
          userType: '',
          healthcareSpecialty: ''
        });
      }
      this.suggestionAppliedBySystem = false;
      this.showSuggestionBanner = false;
    }
  
      sendFeedback(){
        if (this.formulario.valid) {
          this.sending = true;
          const respuesta1 = this.formulario.get('pregunta1')?.value;
          const respuesta2 = this.formulario.get('pregunta2')?.value;
          const moreFunct = this.formulario.get('moreFunct')?.value;
          const freeText = this.formulario.get('freeText')?.value;
          const rawHealthcareSpecialty = this.formulario.get('healthcareSpecialty')?.value;
          const healthcareSpecialty = (rawHealthcareSpecialty || '').trim();
          const feedbackFormValue = { ...this.formulario.value };
          delete feedbackFormValue.healthcareSpecialty;
      
          //this.mainForm.value.email = (this.mainForm.value.email).toLowerCase();
          //this.mainForm.value.lang=this.translate.store.currentLang;
          var value = { 
            value: feedbackFormValue, 
            healthcareSpecialty,
            myuuid: this.myuuid, 
            lang: this.translate.store.currentLang,
            model: this.model,
            fileNames: this.fileNames,
            isBetaPage: this.isBetaPage
          }
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
        const topSpecialties = Array.isArray(inferredProfile.topSpecialties) ? inferredProfile.topSpecialties : [];
        const topCatalogSpecialties = topSpecialties.filter((specialty: string) =>
          this.healthcareSpecialtyOptions.some(option => option.value === specialty)
        );

        if (!feedbackAutofillRecommended || inferredUserType !== 'professional') {
          return;
        }

        this.suggestionPrimarySpecialty = topCatalogSpecialties[0] || '';
        this.suggestionAlternativeSpecialties = topCatalogSpecialties.slice(1, 3);
        this.showSuggestionBanner = true;

        this.formulario.patchValue({ userType: inferredUserType });
        if (this.suggestionPrimarySpecialty) {
          this.formulario.patchValue({ healthcareSpecialty: this.suggestionPrimarySpecialty });
          this.suggestionAppliedBySystem = true;
        }
    }

}
