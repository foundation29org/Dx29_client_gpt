import { Directive, HostListener, Inject } from '@angular/core';

import { SidebarLinkDirective } from "./sidebarlink.directive";

@Directive({
  selector: "[appSidebarAnchorToggle]"
})
export class SidebarAnchorToggleDirective {
  protected navlink: SidebarLinkDirective;

  constructor(
    @Inject(SidebarLinkDirective) navlink: SidebarLinkDirective
  ) {
    this.navlink = navlink;
  }

  @HostListener("click", ["$event"])
  onClick() {
    this.navlink.toggle();
  }
}
