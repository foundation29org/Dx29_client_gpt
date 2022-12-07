import {
  Directive,
  ElementRef,
  HostListener,
  AfterViewInit,
  OnInit,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  Renderer2
} from "@angular/core";
import { SidebarLinkDirective } from "./sidebarlink.directive";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";

@Directive({ selector: "[appSidebar]" })
export class SidebarDirective implements OnInit, AfterViewInit {
  public navlinks: Array<SidebarLinkDirective> = [];
  activeLinks: string[] = [];
  protected $wrapper: Element;
  private activeRoute: string;
  protected innerWidth: any;

  @Output()
  toggleHideSidebar = new EventEmitter();

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {

    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(
      event => {
        var tempUrl= (event.url).toString().split('?');
        var tempUrl1 = (tempUrl[0]).toString();
        if(tempUrl1.indexOf('/clinical/diagnosis')!=-1){
          this.innerWidth = window.innerWidth;
          if (this.innerWidth < 992) {
            this.renderer.removeClass(this.$wrapper, 'nav-collapsed');
            this.renderer.removeClass(this.$wrapper, 'menu-collapsed');
            this.toggleHideSidebar.emit(true);
          }
          if (this.innerWidth > 992) {
            const toggleStatus = this.el.nativeElement
            this.el.nativeElement.querySelector('.toggle-icon')
              .getAttribute("data-toggle");
            if (
              toggleStatus === "collapsed" &&
              this.$wrapper.classList.contains("nav-collapsed") &&
              this.$wrapper.classList.contains("menu-collapsed")
            ) {
              this.$wrapper.classList.add("nav-collapsed");
              this.$wrapper.classList.add("menu-collapsed");
            }
            this.toggleHideSidebar.emit(false);
          }
        }else{
          this.toggleHideSidebar.emit(true);
        }


      }
    );
  }

  ngOnInit() {
    this.activeRoute = this.router.url;
    this.innerWidth = window.innerWidth;
  }

  ngAfterViewInit() {
    const element: HTMLElement = this.el.nativeElement;
    this.$wrapper = this.renderer.parentNode(this.el.nativeElement) ;// document.getElementsByClassName("wrapper")[0];

    const $sidebar_img_container = this.el.nativeElement.querySelector('.sidebar-background');
    const $sidebar_img = element.getAttribute("data-image");

    if ($sidebar_img_container.length !== 0 && $sidebar_img !== undefined) {
      this.renderer.setAttribute($sidebar_img_container, 'style','background-image: url("' + $sidebar_img + '")' );
    }

    if (!this.$wrapper.classList.contains("nav-collapsed")) {
      this.expandActive();
    }
    if (this.innerWidth < 992) {
      this.renderer.removeClass(this.$wrapper, 'nav-collapsed');
      this.renderer.removeClass(this.$wrapper, 'menu-collapsed');
      this.toggleHideSidebar.emit(true);
    }
    this.cd.detectChanges();
  }

  @HostListener("mouseenter", ["$event"])
  onMouseOver(e: any) {
    if (this.$wrapper.classList.contains("nav-collapsed")) {
      this.renderer.removeClass(this.$wrapper, 'menu-collapsed');

      this.navlinks
        .filter(_ => _.navCollapsedOpen === true)
        .forEach((link: SidebarLinkDirective) => {
          link.open = true;
          link.navCollapsedOpen = false;
        });
    }
  }

  @HostListener("mouseleave", ["$event"])
  onMouseOut(e: any) {
    if (this.$wrapper.classList.contains("nav-collapsed")) {
      this.renderer.addClass(this.$wrapper, 'menu-collapsed');

      this.navlinks
        .filter(_ => _.open === true)
        .forEach((link: SidebarLinkDirective) => {
          link.open = false;
          link.navCollapsedOpen = true;
        });
    }
  }

  @HostListener("click", ["$event"])
  onClick(e: any) {
    if (
      e.target.parentElement.classList.contains("logo-text") ||
      e.target.parentElement.classList.contains("logo-img")
    ) {
      this.activeLinks = [];
      this.activeRoute = this.router.url;
      this.expandActive();
      this.hideSidebar();
    } else if (
      e.target.parentElement.classList.contains("nav-close") ||
      e.target.classList.contains("nav-close")
    ) {
      this.toggleHideSidebar.emit(true);
    }
  }

  @HostListener("window:resize", ["$event"])
  onResize(event) {
    this.innerWidth = window.innerWidth;
    if (event.target.innerWidth < 992) {
      this.renderer.removeClass(this.$wrapper, 'nav-collapsed');
      this.renderer.removeClass(this.$wrapper, 'menu-collapsed');
      this.toggleHideSidebar.emit(true);
    }
    if (event.target.innerWidth > 992) {
      const toggleStatus = this.el.nativeElement
      this.el.nativeElement.querySelector('.toggle-icon')
        .getAttribute("data-toggle");
      if (
        toggleStatus === "collapsed" &&
        this.$wrapper.classList.contains("nav-collapsed") &&
        this.$wrapper.classList.contains("menu-collapsed")
      ) {
        this.$wrapper.classList.add("nav-collapsed");
        this.$wrapper.classList.add("menu-collapsed");
      }
      this.toggleHideSidebar.emit(false);
    }
  }

  // check outside click and close sidebar for smaller screen <992
  @HostListener("document:click", ["$event"])
  onOutsideClick(event) {
    if (this.innerWidth < 992) {
      let clickedComponent = event.target;
      let inside = false;
      do {
        if (clickedComponent === this.el.nativeElement) {
          inside = true;
        }
        clickedComponent = clickedComponent.parentNode;
      } while (clickedComponent);

      if (
        !this.el.nativeElement.classList.contains("hide-sidebar") &&
        !inside &&
        !event.target.classList.contains("navbar-toggle")
      ) {
        this.toggleHideSidebar.emit(true);
      }
    }
  }



  addLink(link: SidebarLinkDirective): void {
    this.navlinks.push(link);
  }

  getLinks() {
    return this.navlinks;
  }

  hideSidebar() {
    if (this.innerWidth < 992) {
      this.toggleHideSidebar.emit(true);
    }
  }

  expandActive(): void {
    this.navlinks
      .filter(_ => _.routePath === this.activeRoute)
      .forEach((link: SidebarLinkDirective) => {
        link.isShown = true;
        if (link.level.toString().trim() === "3") {
          this.navlinks
            .filter(
              _ => _.level.toString().trim() === "2" && _.title === link.parent
            )
            .forEach((parentLink: SidebarLinkDirective) => {
              parentLink.open = true;
              this.activeLinks.push(parentLink.title);
              this.navlinks
                .filter(
                  _ =>
                    _.level.toString().trim() === "1" &&
                    _.title === parentLink.parent
                )
                .forEach((superParentLink: SidebarLinkDirective) => {
                  superParentLink.open = true;
                  this.activeLinks.push(superParentLink.title);
                  superParentLink.toggleEmit.emit(this.activeLinks);
                });
            });
        } else if (link.level.toString().trim() === "2") {
          this.navlinks
            .filter(
              _ => _.level.toString().trim() === "1" && _.title === link.parent
            )
            .forEach((parentLink: SidebarLinkDirective) => {
              parentLink.open = true;
              this.activeLinks.push(parentLink.title);
              parentLink.toggleEmit.emit(this.activeLinks);
            });
        }
      });
  }

  toggleActiveList() {
    this.navlinks
      .filter(
        _ =>
          _.level.toString().trim() === "3" && _.routePath !== this.activeRoute
      )
      .forEach((link: SidebarLinkDirective) => {
        link.active = false;
      });
  }

  setIsShown(parentLink: SidebarLinkDirective): void {
    const childLevel = Number(parentLink.level) + 1;
    this.navlinks
      .filter(
        _ =>
          _.level.toString().trim() === childLevel.toString().trim() &&
          _.parent === parentLink.title
      )
      .forEach((link: SidebarLinkDirective) => {
        link.isShown = true;
        link.isHidden = false;
      });
  }

  setIsHidden(parentLink: SidebarLinkDirective): void {
    const childLevel = Number(parentLink.level) + 1;
    this.navlinks
      .filter(
        _ =>
          _.level.toString().trim() === childLevel.toString().trim() &&
          _.parent === parentLink.title
      )
      .forEach((link: SidebarLinkDirective) => {
        link.isShown = false;
        link.isHidden = true;
      });
  }
}
