import { Component, ViewChild, ViewChildren, ElementRef, QueryList, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})

export class FooterComponent{

  isHomePage: boolean = false;
  isAboutPage: boolean = false;
  isReportsPage: boolean = false;
  modalReference: NgbModalRef;
  modalReference2: NgbModalRef;
  sending: boolean = false;
  msgfeedBack: string = '';
  checkSubscribe: boolean = false;
  acceptTerms: boolean = false;
  showErrorForm: boolean = false;
  terms2: boolean = false;
  @ViewChild('f') feedbackDownForm: NgForm;
  @ViewChildren('autoajustable') textAreas: QueryList<ElementRef>;
  email: string = '';

  constructor(private modalService: NgbModal, private http: HttpClient, public toastr: ToastrService, public translate: TranslateService, private renderer: Renderer2, private router: Router) { 
    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(

      event => {
        var tempUrl = (event.url).toString();
        if (tempUrl.indexOf('/.') != -1 || tempUrl == '/') {
          this.isHomePage = true;
          this.isAboutPage = false;
          this.isReportsPage = false;
        } else if (tempUrl.indexOf('/aboutus') != -1) {
          this.isHomePage = false;
          this.isAboutPage = true;
          this.isReportsPage = false;
        }else if (tempUrl.indexOf('/reports') != -1) {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isReportsPage = true;
        } else {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isReportsPage = false;
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
  if (!this.feedbackDownForm) { return; }
  const base = this.feedbackDownForm;
  for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
  }
}

onSubmitRevolution() {
  this.sending = true;
  var params = { email: this.email, description: this.msgfeedBack, lang: sessionStorage.getItem('lang'), subscribe: this.checkSubscribe };
  this.http.post(environment.serverapi + '/api/subscribe/', params)
      .subscribe((res: any) => {
          this.sending = false;
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
          this.toastr.error('', this.translate.instant("generics.error try again"));
      });

}

resizeTextArea(){
  this.resizeTextAreaFunc(this.textAreas);
}

private resizeTextAreaFunc(elements: QueryList<ElementRef>) {
  elements.forEach((element: ElementRef) => {
    const nativeElement = element.nativeElement;
    this.renderer.listen(nativeElement, 'input', () => {
      let height = nativeElement.scrollHeight;
      if (height < 50) height = 50;
      this.renderer.setStyle(nativeElement, 'height', `${height}px`);
    });
    let height = nativeElement.scrollHeight;
    if (height < 50) height = 50;
    this.renderer.setStyle(nativeElement, 'height', `${height}px`);
  });
}

closeSupport(){
  this.msgfeedBack = '';
  this.email = '';
  this.modalReference.close();
  this.acceptTerms = false;
  this.checkSubscribe = false;
}

closeModal() {
  if (this.modalReference != undefined) {
      this.modalReference.close();
      this.modalReference = undefined;
  }
}

openModal(panel) {
  let ngbModalOptions: NgbModalOptions = {
      keyboard: true,
      windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  this.modalReference = this.modalService.open(panel, ngbModalOptions);
  this.scrollTo();
}

async openModal2(panel) {
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
