import {
  Component,
  OnInit,
  ElementRef,
  Inject,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  ViewChild
} from "@angular/core";
import { Router, NavigationStart } from '@angular/router';
import { TranslateService } from "@ngx-translate/core";
import { ConfigService } from "app/shared/services/config.service";
import { DOCUMENT } from "@angular/common";
import { LayoutService } from "app/shared/services/layout.service";
import { Subscription } from "rxjs";

var fireRefreshEventOnWindow = function() {
  var evt = document.createEvent("HTMLEvents");
  evt.initEvent("resize", true, false);
  window.dispatchEvent(evt);
};

@Component({
    selector: 'app-land-page-layout',
    templateUrl: './land-page-layout.component.html',
    styleUrls: ['./land-page-layout.component.scss']
})

export class LandPageLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("appSidebar", {static: true}) appSidebar: ElementRef;
  @ViewChild("wrapper", {static: true}) wrapper: ElementRef;
  currentDate : Date = new Date();
  options = {
    direction: "ltr",
    bgColor: "black",
    bgImage: "assets/img/sidebar-bg/01.jpg"
  };
  hideSidebar: boolean;
  layoutSub: Subscription;
  iscollapsed = false;
  isSidebar_sm = false;
  isSidebar_lg = false;
  bgColor = "black";
  bgImage = "assets/img/sidebar-bg/01.jpg";
  isGTPPage: boolean = false;
  isHomePage: boolean = false;

  public config: any = {};

  isIeOrEdge = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) || /Edge/.test(navigator.userAgent);

  constructor(
    private elementRef: ElementRef,
    private layoutService: LayoutService,
    private configService: ConfigService,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
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
    //event emitter call from customizer
    this.layoutSub = layoutService.customizerChangeEmitted$.subscribe(
      options => {
        if (options) {
          if (options.bgColor) {
            this.bgColor = options.bgColor;
          }
          if (options.bgImage) {
            this.bgImage = options.bgImage;
          }

          if (options.bgImageDisplay === true) {
            this.bgImage = options.bgImage;
          } else if (options.bgImageDisplay === false) {
            this.bgImage = "";
          }

          if (options.compactMenu === true) {
            this.renderer.addClass(this.wrapper.nativeElement, "nav-collapsed");
            this.renderer.addClass(
              this.wrapper.nativeElement,
              "menu-collapsed"
            );
          } else if (options.compactMenu === false) {
            if (
              this.wrapper.nativeElement.classList.contains("nav-collapsed")
            ) {
              this.renderer.removeClass(
                this.wrapper.nativeElement,
                "nav-collapsed"
              );
              this.renderer.removeClass(
                this.wrapper.nativeElement,
                "menu-collapsed"
              );
            }
          }

          if (options.sidebarSize === "sidebar-lg") {
            this.isSidebar_sm = false;
            this.isSidebar_lg = true;
          } else if (options.sidebarSize === "sidebar-sm") {
            this.isSidebar_sm = true;
            this.isSidebar_lg = false;
          } else {
            this.isSidebar_sm = false;
            this.isSidebar_lg = false;
          }

          if (options.layout === "Light") {
            this.renderer.removeClass(this.document.body, "layout-dark");
            this.renderer.removeClass(this.document.body, "layout-transparent");
            this.renderer.removeClass(this.document.body, "bg-hibiscus");
            this.renderer.removeClass(this.document.body, "bg-purple-pizzazz");
            this.renderer.removeClass(this.document.body, "bg-blue-lagoon");
            this.renderer.removeClass(this.document.body, "bg-electric-violet");
            this.renderer.removeClass(this.document.body, "bg-portage");
            this.renderer.removeClass(this.document.body, "bg-tundora");
            this.renderer.removeClass(this.document.body, "bg-glass-1");
            this.renderer.removeClass(this.document.body, "bg-glass-2");
            this.renderer.removeClass(this.document.body, "bg-glass-3");
            this.renderer.removeClass(this.document.body, "bg-glass-4");
          } else if (options.layout === "Dark") {
            if (this.document.body.classList.contains("layout-transparent")) {
              this.renderer.removeClass(
                this.document.body,
                "layout-transparent"
              );
              this.renderer.removeClass(this.document.body, "bg-hibiscus");
              this.renderer.removeClass(
                this.document.body,
                "bg-purple-pizzazz"
              );
              this.renderer.removeClass(this.document.body, "bg-blue-lagoon");
              this.renderer.removeClass(
                this.document.body,
                "bg-electric-violet"
              );
              this.renderer.removeClass(this.document.body, "bg-portage");
              this.renderer.removeClass(this.document.body, "bg-tundora");
              this.renderer.removeClass(this.document.body, "bg-glass-1");
              this.renderer.removeClass(this.document.body, "bg-glass-2");
              this.renderer.removeClass(this.document.body, "bg-glass-3");
              this.renderer.removeClass(this.document.body, "bg-glass-4");

              this.renderer.addClass(this.document.body, "layout-dark");
            } else {
              this.renderer.addClass(this.document.body, "layout-dark");
            }
          } else if (options.layout === "Transparent") {
            this.renderer.addClass(this.document.body, "layout-transparent");
            this.renderer.addClass(this.document.body, "layout-dark");
            this.renderer.addClass(this.document.body, "bg-glass-1");
          }

          if (options.transparentColor) {
            this.renderer.removeClass(this.document.body, "bg-hibiscus");
            this.renderer.removeClass(this.document.body, "bg-purple-pizzazz");
            this.renderer.removeClass(this.document.body, "bg-blue-lagoon");
            this.renderer.removeClass(this.document.body, "bg-electric-violet");
            this.renderer.removeClass(this.document.body, "bg-portage");
            this.renderer.removeClass(this.document.body, "bg-tundora");
            this.renderer.removeClass(this.document.body, "bg-glass-1");
            this.renderer.removeClass(this.document.body, "bg-glass-2");
            this.renderer.removeClass(this.document.body, "bg-glass-3");
            this.renderer.removeClass(this.document.body, "bg-glass-4");
            this.renderer.addClass(
              this.document.body,
              options.transparentColor
            );
          }
        }
      }
    );
  }

  ngOnInit() {
    this.config = this.configService.templateConf;
    this.bgColor = this.config.layout.sidebar.backgroundColor;

    if (!this.config.layout.sidebar.backgroundImage) {
      this.bgImage = "";
    } else {
      this.bgImage = this.config.layout.sidebar.backgroundImageURL;
    }

    if (this.config.layout.variant === "Transparent") {
      if (this.config.layout.sidebar.backgroundColor.toString().trim() === "") {
        this.bgColor = "bg-glass-1";
      }
    } else {
      if (this.config.layout.sidebar.backgroundColor.toString().trim() === "") {
        this.bgColor = "black";
      }
    }

    setTimeout(() => {
      if (this.config.layout.sidebar.size === "sidebar-lg") {
        this.isSidebar_sm = false;
        this.isSidebar_lg = true;
      } else if (this.config.layout.sidebar.size === "sidebar-sm") {
        this.isSidebar_sm = true;
        this.isSidebar_lg = false;
      } else {
        this.isSidebar_sm = false;
        this.isSidebar_lg = false;
      }
      this.iscollapsed = this.config.layout.sidebar.collapsed;
    }, 0);

    //emit event to customizer
    this.options.bgColor = this.bgColor;
    this.options.bgImage = this.bgImage;

    this.layoutService.emitCustomizerChange(this.options);

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



    setTimeout(() => {
      if (this.config.layout.dir) {
        this.options.direction = this.config.layout.dir;
      }

      if (this.config.layout.variant === "Dark") {
        this.renderer.addClass(this.document.body, "layout-dark");
      } else if (this.config.layout.variant === "Transparent") {
        this.renderer.addClass(this.document.body, "layout-dark");
        this.renderer.addClass(this.document.body, "layout-transparent");
        if (this.config.layout.sidebar.backgroundColor) {
          this.renderer.addClass(
            this.document.body,
            this.config.layout.sidebar.backgroundColor
          );
        } else {
          this.renderer.addClass(this.document.body, "bg-glass-1");
        }
        this.bgColor = "black";
        this.options.bgColor = "black";
        this.bgImage = "";
        this.options.bgImage = "";
        this.bgImage = "";
      }
    }, 0);
  }

  ngOnDestroy() {
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
  }

  onClick(event) {
    //initialize window resizer event on sidebar toggle click event
    setTimeout(() => {
      fireRefreshEventOnWindow();
    }, 300);
  }

  toggleHideSidebar($event: boolean): void {
    setTimeout(() => {
      this.hideSidebar = $event;
    }, 0);
  }

}
