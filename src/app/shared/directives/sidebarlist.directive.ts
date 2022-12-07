import { Directive } from "@angular/core";
import { SidebarLinkDirective } from "./sidebarlink.directive";

@Directive({ selector: "[appSidebarList]" })
export class SidebarListDirective {
  protected navlinks: Array<SidebarLinkDirective> = [];
  public activeLinks: string[] = [];

  setList(list: Array<SidebarLinkDirective>) {
    this.navlinks = list;
  }

  collapse(link: SidebarLinkDirective): void {
    link.open = false;
    this.setIsHidden(link);
    if (link.level.toString().trim() === "2") {
      this.activeLinks.push(this.navlinks
        .filter(_ => _.level.toString().trim() === "1" &&  _.open === true)[0].title);
      }
     link.toggleEmit.emit(this.activeLinks);
  }

  expand(link: SidebarLinkDirective): void {
    link.open = true;
    this.activeLinks.push(link.title);
    this.collapseOtherLinks(link);
    this.setIsShown(link);
    link.toggleEmit.emit(this.activeLinks);
  }

  toggleActiveList(openLink: SidebarLinkDirective) {
    this.navlinks
      .filter(_ => _.level.toString().trim() === "3")
      .forEach((link: SidebarLinkDirective) => {
        if (link !== openLink) {
          link.active = false;
        }
      });
  }

  collapseOtherLinks(openLink: SidebarLinkDirective): void {
    if (openLink.level.toString().trim() === "1") {
      this.navlinks
        .filter(
          _ =>
            (_.level.toString().trim() === openLink.level.toString().trim() ||
              _.level.toString().trim() === "2") &&
            _.open === true
        )
        .forEach((link: SidebarLinkDirective) => {
          if (link !== openLink) {
            link.open = false;
            this.setIsHidden(link);
          }
        });
    } else if (openLink.level.toString().trim() === "2") {
      this.activeLinks.push(this.navlinks
        .filter(_ => _.level.toString().trim() === "1" &&  _.open === true)[0].title);
      this.navlinks
        .filter(
          _ =>
            _.level.toString().trim() === openLink.level.toString().trim() &&
            _.parent === openLink.parent &&
            _.open === true
        )
        .forEach((link: SidebarLinkDirective) => {
          if (link !== openLink) {
            link.open = false;
            this.setIsHidden(link);
          }
        });
    }
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
