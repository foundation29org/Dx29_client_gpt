import { browser} from 'protractor';

export class LoginComponentPage {
  loginForm={value:{email:"",password:""}};
  navigateToLogin(){
    return browser.driver.get('/login');
  }
}
