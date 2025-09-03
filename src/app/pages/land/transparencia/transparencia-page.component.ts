import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { environment } from 'environments/environment';
import Swal from 'sweetalert2';
declare let gtag: any;
import { UuidService } from 'app/shared/services/uuid.service';

@Component({
    selector: 'app-transparencia-page',
    templateUrl: './transparencia-page.component.html',
    styleUrls: ['./transparencia-page.component.scss'],
})

export class TransparenciaPageComponent {

    _startTime: any;
    myuuid: string;
    modalReference: NgbModalRef;
    sending: boolean = false;
    msgfeedBack: string = '';
    userName: string = '';
    checkSubscribe: boolean = false;
    acceptTerms: boolean = false;
    showErrorForm: boolean = false;
    @ViewChild('f') dataForm: NgForm;
    email: string = '';

    constructor( 
        public translate: TranslateService, 
        public insightsService: InsightsService, 
        private uuidService: UuidService,
        private modalService: NgbModal,
        private http: HttpClient
    ) {
        this._startTime = Date.now();
        this.myuuid = this.uuidService.getUuid();
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

    openSupport(content) {
        let ngbModalOptions: NgbModalOptions = {
            keyboard: true,
            windowClass: 'ModalClass-sm'
        };
        this.modalReference = this.modalService.open(content, ngbModalOptions);
    }

    submitInvalidForm() {
        this.showErrorForm = true;
        if (!this.dataForm) { return; }
        const base = this.dataForm;
        for (const field in base.form.controls) {
            if (!base.form.controls[field].valid) {
                base.form.controls[field].markAsTouched()
            }
        }
    }

    onSubmitRevolution() {
        this.sending = true;
        var params = { userName: this.userName, email: this.email, description: this.msgfeedBack, lang: sessionStorage.getItem('lang'), subscribe: this.checkSubscribe, myuuid: this.myuuid };
        this.http.post(environment.api + '/internal/homesupport/', params)
            .subscribe((res: any) => {
                this.sending = false;
                this.userName = '';
                this.msgfeedBack = '';
                this.email = '';
                this.checkSubscribe = false;
                this.acceptTerms = false;
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
                console.log(err);
                this.sending = false;
                this.checkSubscribe = false;
                this.acceptTerms = false;
                Swal.fire({
                    icon: 'error',
                    html: this.translate.instant('generics.error try again'),
                    showCancelButton: false,
                    showConfirmButton: true,
                    allowOutsideClick: false
                });
            });
    }

    autoResize(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    closeSupport() {
        this.userName = '';
        this.msgfeedBack = '';
        this.email = '';
        this.modalReference.close();
        this.acceptTerms = false;
        this.checkSubscribe = false;
    }

    openTermsModal() {
        // TODO: Implement terms modal
        alert('Terms modal to be implemented');
    }

}