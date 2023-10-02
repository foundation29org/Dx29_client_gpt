import {
  Component,
  AfterViewInit
} from "@angular/core";
import { Router, NavigationStart } from '@angular/router';


@Component({
    selector: 'app-land-page-layout',
    templateUrl: './land-page-layout.component.html',
    styleUrls: ['./land-page-layout.component.scss']
})

export class LandPageLayoutComponent implements AfterViewInit {
  isGTPPage: boolean = false;
  isHomePage: boolean = false;


  constructor(
    private router: Router
  ) {
    if ((this.router.url).indexOf('/.') != -1 || (this.router.url)== '/') {
      this.isHomePage = true;
      this.isGTPPage = false;
    }else if((this.router.url).indexOf('/juntoshaciaeldiagnostico')!=-1){
      this.isGTPPage = true;
      this.isHomePage = false;
    }else{
      this.isGTPPage = false;
      this.isHomePage = false;
    }
  }

  ngAfterViewInit() {
    this.router.events.filter((event: any) => event instanceof NavigationStart).subscribe(

      event => {
        var tempUrl = (event.url).toString();
        if(tempUrl.indexOf('/.') != -1 || tempUrl== '/'){
          this.isHomePage = true;
          this.isGTPPage = false;
        }else if(tempUrl.indexOf('/juntoshaciaeldiagnostico')!=-1){
          this.isGTPPage = true;
          this.isHomePage = false;
        }else{
          this.isGTPPage = false;
          this.isHomePage = false;
        }
      }
    );
  }

}
