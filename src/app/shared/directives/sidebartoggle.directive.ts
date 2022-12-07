import { Directive, HostBinding, Input, HostListener, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';

@Directive({ selector: "[appSidebarToggle]" })
export class SidebarToggleDirective implements AfterViewInit {
  @HostBinding("attr.data-toggle")
  @Input()
  get dataToggle(): string {
    return this._dataToggle;
  }
  set dataToggle(value: string) {
    this._dataToggle = value;
  }

  @HostBinding("class.ft-toggle-right")
  @Input()
  get toggleRight(): boolean {
    return this._toggleRight;
  }
  set toggleRight(value: boolean) {
    this._toggleRight = value;
  }

  @HostBinding("class.ft-toggle-left")
  @Input()
  get toggleLeft(): boolean {
    return this._toggleLeft;
  }
  set toggleLeft(value: boolean) {
    this._toggleLeft = value;
  }

  protected _dataToggle = "expanded";
  protected _toggleRight = true;
  protected _toggleLeft = false;
  protected $wrapper: Element;
  protected compact_menu_checkbox;

  constructor(private el: ElementRef,
    private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.$wrapper = document.getElementsByClassName("wrapper")[0];
    this.compact_menu_checkbox = this.$wrapper.querySelector('.cz-compact-menu');
  }

  @HostListener("click", ["$event"])
  onClick(e: any) {
    if (this.dataToggle === "expanded") {
      this.dataToggle = "collapsed";
      this.renderer.addClass(this.$wrapper, 'nav-collapsed');
      if (this.compact_menu_checkbox) {
        this.compact_menu_checkbox.checked = true;
      }
    } else {
      this.dataToggle = "expanded";
      this.renderer.removeClass(this.$wrapper, 'nav-collapsed');
      this.renderer.removeClass(this.$wrapper, 'menu-collapsed');
      if (this.compact_menu_checkbox) {
        this.compact_menu_checkbox.checked = false;
      }
    }
    this.toggleLeft = !this.toggleLeft;
    this.toggleRight = !this.toggleRight;

    setTimeout(() => {
      this.fireRefreshEventOnWindow();
    }, 300);
  }

  fireRefreshEventOnWindow = function() {
    const evt = document.createEvent("HTMLEvents");
    evt.initEvent("resize", true, false);
    window.dispatchEvent(evt);
  };
}
