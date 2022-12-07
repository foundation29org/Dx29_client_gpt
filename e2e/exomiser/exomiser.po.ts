import { browser} from 'protractor';

export class DiagnosisComponentPage {
  navigateTo() {
    return browser.driver.get('/clinical/diagnosis');
  }
}
