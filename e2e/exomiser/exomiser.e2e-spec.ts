import {DiagnosisComponentPage} from './exomiser.po';
import {LoginComponentPage} from './login.po';

import { by, element, browser } from 'protractor';

import {LoginPageComponent} from '../../src/app/pages/content-pages/login/login-page.component';
import { Router, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { TranslateService } from '@ngx-translate/core';
import { PatientService } from 'app/shared/services/patient.service';
import { NgxHotjarService } from 'ngx-hotjar';

describe('Testing of Exomiser', () => {
  let page: DiagnosisComponentPage;
  let loginpage: LoginComponentPage;

  beforeEach(() => {
    
    var login = new LoginComponentPage();
    login.navigateToLogin().then(()=>{
    //route.navigate(['/login']).then(()=>{
      browser.driver.sleep(1000)
      login.loginForm.value.email="testpatient2@test.com";
      login.loginForm.value.password="tttttttt"
      login.onSubmit();
      page = new DiagnosisComponentPage();
    })
    
  });

  it('Exo_0100', () => {
      page.navigateTo().then(()=>{
        browser.driver.sleep(1000)
        element(by.id('idShowPanelWorkbench')).click();
        //expect(element(by.id('buttonChangeTab')).isDisplayed()).toBeTruthy();
      });
  });
});
