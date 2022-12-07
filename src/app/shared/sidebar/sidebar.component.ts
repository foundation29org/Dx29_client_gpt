import { Component, OnInit, Input, ViewChild, OnDestroy, ElementRef, Renderer2, AfterViewInit } from "@angular/core";

import { ROUTESHOMEDX} from './sidebar-routes.config';
import { RouteInfo } from "./sidebar.metadata";
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { customAnimations } from "../animations/custom-animations";
import { ConfigService } from '../services/config.service';
import { LayoutService } from '../services/layout.service';
import { Subscription } from 'rxjs';
import { EventsService} from 'app/shared/services/events.service';
import { Data } from 'app/shared/services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  animations: customAnimations
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('toggleIcon') toggleIcon: ElementRef;
  public menuItems: any[];
  depth: number;
  activeTitle: string;
  activeTitles: string[] = [];
  expanded: boolean;
  nav_collapsed_open = false;
  logoUrl = 'assets/img/logo.png';
  public config: any = {};
  layoutSub: Subscription;
  urlLogo: string = 'assets/img/logo-Dx29.png';
  urlLogo2: string = 'assets/img/logo-Dx29.png';
  redirectUrl: string = '';
  isHomePage: boolean = false;
  isClinicalPage: boolean = false;
  actualStep: string = "0.0";
  maxStep: string = "0.0";
  showintrowizard: boolean = true;
  age: any = {};
  selectedPatient: any = {};

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private route: ActivatedRoute,
    public translate: TranslateService,
    private configService: ConfigService,
    private layoutService: LayoutService,
    private eventsService: EventsService,
     private dataservice: Data,
  ) {
    if (this.depth === undefined) {
      this.depth = 0;
      this.expanded = true;
    }
    this.layoutSub = layoutService.customizerChangeEmitted$.subscribe(
      options => {
        if (options) {
          if (options.bgColor) {
            if (options.bgColor === 'white') {
              this.logoUrl = 'assets/img/logo-dark.png';
            }
            else {
              this.logoUrl = 'assets/img/logo.png';
            }
          }
          if (options.compactMenu === true) {
            this.expanded = false;
            this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
            this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
            this.nav_collapsed_open = true;
          }
          else if (options.compactMenu === false) {
            this.expanded = true;
            this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
            this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
            this.nav_collapsed_open = false;
          }

        }
      });


    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(

      event => {
        var tempUrl= (event.url).toString().split('?');
        var actualUrl = tempUrl[0];
        var tempUrl1 = (actualUrl).toString();
        if(tempUrl1.indexOf('/dashboard')!=-1){
          this.isHomePage = true;
          this.isClinicalPage = false;
        }else{
          if(tempUrl1.indexOf('/clinical/diagnosis')!=-1){
            this.isClinicalPage = true;
          }else{
            this.isClinicalPage = false;
          }
          this.isHomePage = false;
        }
        this.menuItems = ROUTESHOMEDX.filter(menuItem => menuItem);
      }
    );
  }


  ngOnInit() {
    this.config = this.configService.templateConf;
    this.menuItems = ROUTESHOMEDX.filter(menuItem => menuItem);
    if (this.config.layout.sidebar.backgroundColor === 'white') {
      this.logoUrl = 'assets/img/logo-dark.png';
    }
    else {
      this.logoUrl = 'assets/img/logo.png';
    }

    this.eventsService.on('actualStep', function(actualStep) {
      this.actualStep= this.dataservice.steps.actualStep;
    }.bind(this));

    this.eventsService.on('maxStep', function(maxStep) {
      this.maxStep= this.dataservice.steps.maxStep;
    }.bind(this));

    this.eventsService.on('showIntroWizard', function(showintrowizard) {
      this.showintrowizard= showintrowizard;
    }.bind(this));

    this.eventsService.on('selectedPatient', function(selectedPatient) {
      this.selectedPatient= selectedPatient;
      var dateRequest2=new Date(this.selectedPatient.birthDate);
      this.ageFromDateOfBirthday(dateRequest2);
    }.bind(this));

  }

  ageFromDateOfBirthday(dateOfBirth: any){
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    var months;
    months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months -= birthDate.getMonth();
    months += today.getMonth();
    var age =0;
    if(months>0){
      age = Math.floor(months/12)
    }
    var res = months <= 0 ? 0 : months;
    var m=res % 12;
    this.age = {years:age, months:m }
  }

  ngAfterViewInit() {

    setTimeout(() => {
      if (this.config.layout.sidebar.collapsed != undefined) {
        if (this.config.layout.sidebar.collapsed === true) {
          this.expanded = false;
          this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
          this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
          this.nav_collapsed_open = true;
        }
        else if (this.config.layout.sidebar.collapsed === false) {
          this.expanded = true;
          this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
          this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
          this.nav_collapsed_open = false;
        }
      }
    }, 0);


  }

  ngOnDestroy() {
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
  }

  toggleSlideInOut() {
    this.expanded = !this.expanded;
  }

  handleToggle(titles) {
    this.activeTitles = titles;
  }

  // NGX Wizard - skip url change
  ngxWizardFunction(path: string) {
    if (path.indexOf("forms/ngx") !== -1)
      this.router.navigate(["forms/ngx/wizard"], { skipLocationChange: false });
  }


  startWizardAgain(){
    Swal.fire({
        title: this.translate.instant("diagnosis.wizardquestionlaunch"),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#33658a',
        cancelButtonColor: '#B0B6BB',
        confirmButtonText: this.translate.instant("generics.Yes"),
        cancelButtonText: this.translate.instant("generics.No"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false,
        reverseButtons:true
    }).then((result) => {
      if (result.value) {

        if(this.showintrowizard){
          this.goToStep('0.0', true, '0.0')
        }else{
          this.goToStep('1.0', true, '1.0')
        }
      }
    });

  }

  goToStep(index, save, maxStep){
    var info = {step: index, save: save, maxStep: maxStep}
    this.eventsService.broadcast('infoStep', info);
  }

  goToReports(){
    this.eventsService.broadcast('setStepWizard', 'reports');
  }

}
