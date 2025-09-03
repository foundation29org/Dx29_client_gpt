import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface ModalFormConfig {
  title: string;
  description: string;
  messagePlaceholder: string;
  submitButtonText: string;
  type: 'contact' | 'subscribe' | 'clinical-data' | 'datasets';
  showMessage?: boolean;
  showTerms?: boolean;
  showSubscribeCheckbox?: boolean;
}

@Component({
  selector: 'app-unified-modal-form',
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{ config.title }}</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="onCancel()"></button>
    </div>
    
    <div class="modal-body">
      <p class="mb-3">{{ config.description }}</p>
      
      <form [formGroup]="unifiedForm" (ngSubmit)="onSubmit()">
        <div class="mb-3">
          <label class="form-label">{{ getNameLabel() }} *</label>
          <input type="text" 
                 class="form-control" 
                 formControlName="name"
                 [placeholder]="getNamePlaceholder()">
          <div class="text-danger small mt-1" *ngIf="getFieldError('name')">
            {{ getNameError() }}
          </div>
        </div>
        
        <div class="mb-3">
          <label class="form-label">{{ getEmailLabel() }} *</label>
          <input type="email" 
                 class="form-control" 
                 formControlName="email"
                 [placeholder]="getEmailPlaceholder()">
          <div class="text-danger small mt-1" *ngIf="getFieldError('email')">
            {{ getEmailError() }}
          </div>
        </div>
        
        <div class="mb-3" *ngIf="config.showMessage">
          <label class="form-label">{{ getMessageLabel() }} *</label>
          <textarea class="form-control" 
                    rows="4" 
                    formControlName="message"
                    [placeholder]="config.messagePlaceholder"
                    [maxlength]="config.type === 'contact' ? 2000 : null"></textarea>
          <div class="text-danger small mt-1" *ngIf="getFieldError('message')">
            {{ getMessageError() }}
          </div>
          <p class="float-end" *ngIf="config.type === 'contact' && unifiedForm.get('message')?.value">
            {{ unifiedForm.get('message')?.value.length || 0 }} / 2000
          </p>
        </div>
        
        <div class="checkboxes-container">
          <div class="checkbox-item" *ngIf="config.showSubscribeCheckbox">
            <mat-checkbox formControlName="subscribe">
              Recibir actualizaciones por email
            </mat-checkbox>
          </div>
          
          <div class="checkbox-item" *ngIf="config.showTerms">
            <mat-checkbox formControlName="acceptTerms">
              Acepto los <a href="javascript:;" class="terms-link" (click)="openTerms()">términos de uso</a>
            </mat-checkbox>
            <div class="text-danger small mt-1" *ngIf="getFieldError('acceptTerms')">
              Debes aceptar los términos
            </div>
          </div>
        </div>
      </form>
    </div>
    
    <div class="modal-footer" *ngIf="!isLoading">
      <button type="button" class="btn btn-secondary" (click)="onCancel()">
        Cancelar
      </button>
      <button type="button" 
              class="btn btn-primary" 
              [disabled]="unifiedForm.invalid"
              (click)="onSubmit()">
        <strong>{{ config.submitButtonText }}</strong>
      </button>
    </div>
    
    <div class="modal-footer justify-content-center" *ngIf="isLoading">
      <i class="fa fa-spinner fa-spin fa-2x text-primary"></i>
    </div>
  `
})
export class UnifiedModalFormComponent {
  @Input() config!: ModalFormConfig;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() modalCancel = new EventEmitter<void>();
  @Output() termsOpen = new EventEmitter<void>();

  unifiedForm: FormGroup;
  isLoading = false;

  constructor(private formBuilder: FormBuilder) {
    this.unifiedForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      message: [''],
      subscribe: [false],
      acceptTerms: [false]
    });
  }

  ngOnInit() {
    // Configure validators based on form type
    if (this.config.showMessage) {
      this.unifiedForm.get('message')?.setValidators([Validators.required]);
    }
    if (this.config.showTerms) {
      this.unifiedForm.get('acceptTerms')?.setValidators([Validators.requiredTrue]);
    }
    this.unifiedForm.updateValueAndValidity();
  }

  getFieldError(fieldName: string): boolean {
    const field = this.unifiedForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getNameLabel(): string {
    return this.config.type === 'contact' ? 'Nombre' : 'Nombre completo';
  }

  getNamePlaceholder(): string {
    return this.config.type === 'contact' ? 'Nombre' : 'Ingresa tu nombre completo';
  }

  getNameError(): string {
    return this.config.type === 'contact' ? 'Campo requerido' : 'El nombre es obligatorio';
  }

  getEmailLabel(): string {
    return 'Correo electrónico';
  }

  getEmailPlaceholder(): string {
    return this.config.type === 'contact' ? 'Correo electrónico' : 'tu@email.com';
  }

  getEmailError(): string {
    return this.config.type === 'contact' ? 'Correo electrónico válido requerido' : 'Ingresa un correo electrónico válido';
  }

  getMessageLabel(): string {
    return this.config.type === 'contact' ? 'Mensaje' : 'Mensaje';
  }

  getMessageError(): string {
    return this.config.type === 'contact' ? 'El mensaje es requerido' : 'El mensaje es obligatorio';
  }

  onSubmit(): void {
    if (this.unifiedForm.valid) {
      this.isLoading = true;
      this.formSubmit.emit({
        type: this.config.type,
        data: this.unifiedForm.value
      });
    }
  }

  onCancel(): void {
    this.modalCancel.emit();
  }

  openTerms(): void {
    this.termsOpen.emit();
  }

  resetForm(): void {
    this.unifiedForm.reset();
    this.isLoading = false;
  }
}