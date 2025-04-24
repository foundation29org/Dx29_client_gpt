import { Component, ViewChild, ViewChildren, ElementRef, QueryList, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { PrivacyPolicyPageComponent } from 'app/pages/land/privacy-policy/privacy-policy.component';
import { CookiesPageComponent } from 'app/pages/land/cookies/cookies.component';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})

export class FooterComponent{

  isHomePage: boolean = false;
  isPolicyPage: boolean = false;
  isCookiesPage: boolean = false;
  modalReference: NgbModalRef;
  modalReference2: NgbModalRef;
  sending: boolean = false;
  msgfeedBack: string = '';
  userName: string = '';
  checkSubscribe: boolean = false;
  acceptTerms: boolean = false;
  showErrorForm: boolean = false;
  terms3: boolean = false;
  @ViewChild('f') dataForm: NgForm;
  @ViewChildren('autoajustable') textAreas: QueryList<ElementRef>;
  email: string = '';

  constructor(private modalService: NgbModal, private http: HttpClient, public translate: TranslateService, private renderer: Renderer2, private router: Router) { 
    this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd)
    ).subscribe(
      event => {
        const tempUrl = (event.url).toString();
        if (tempUrl.indexOf('/.') != -1 || tempUrl == '/') {
          this.isHomePage = true;
          this.isPolicyPage = false;
          this.isCookiesPage = false;
        }else if(tempUrl == '/privacy-policy'){
          this.isHomePage = false;
          this.isPolicyPage = true;
          this.isCookiesPage = false;
        }else if(tempUrl == '/cookies'){
          this.isHomePage = false;
          this.isPolicyPage = false;
          this.isCookiesPage = true;
        }else {
          this.isHomePage = false;
          this.isPolicyPage = false;
          this.isCookiesPage = false;
        }
      }
    );
  }

  openSupport(content){
    let ngbModalOptions: NgbModalOptions = {
        keyboard: true,
        windowClass: 'ModalClass-sm'// xl, lg, sm
      };
    this.modalReference = this.modalService.open(content, ngbModalOptions);
    this.scrollTo();
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
  var params = { userName: this.userName ,email: this.email, description: this.msgfeedBack, lang: sessionStorage.getItem('lang'), subscribe: this.checkSubscribe };
  this.http.post(environment.serverapi + '/api/homesupport/', params)
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

closeSupport(){
  this.userName = '';
  this.msgfeedBack = '';
  this.email = '';
  this.modalReference.close();
  this.acceptTerms = false;
  this.checkSubscribe = false;
}

openModalPolicy() {
  let ngbModalOptions: NgbModalOptions = {
      keyboard: true,
      windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  this.modalService.open(PrivacyPolicyPageComponent, ngbModalOptions);
  this.scrollTo();
}

openModalCookies() {
  let ngbModalOptions: NgbModalOptions = {
      keyboard: true,
      windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  this.modalService.open(CookiesPageComponent, ngbModalOptions);
  this.scrollTo();
}


async openModal(panel) {
  let ngbModalOptions: NgbModalOptions = {
    backdrop : 'static',
      keyboard: false,
      windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  this.modalReference2 = this.modalService.open(panel, ngbModalOptions);
  await this.delay(400);
  document.getElementById('initpopup2').scrollIntoView(true);
}

onTermsAccepted() {
  this.acceptTerms = true;
  this.modalReference2.close();
}

async scrollTo() {
  await this.delay(400);
  //document.getElementById('initpopup').scrollIntoView(true);
  document.getElementById('initpopup').scrollIntoView({ behavior: "smooth" });
}

delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

}
