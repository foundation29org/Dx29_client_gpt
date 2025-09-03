import {
  Component,
  Inject,
  Renderer2,
  HostListener
} from "@angular/core";
import { WINDOW } from 'app/shared/services/window.service';
import { DOCUMENT } from "@angular/common";

@Component({
    selector: 'app-land-page-layout',
    templateUrl: './land-page-layout.component.html',
    styleUrls: ['./land-page-layout.component.scss']
})

export class LandPageLayoutComponent {

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window,
    private renderer: Renderer2
  ) {
    // Scroll inmediato al construir el layout para navegación de pestañas
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }

  scrollToTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    let number = this.window.pageYOffset || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
    if (number > 60) {
      this.renderer.addClass(this.document.body, "navbar-scrolled");
    } else {
      this.renderer.removeClass(this.document.body, "navbar-scrolled");
    }

    if (number > 20) {
      this.renderer.addClass(this.document.body, "page-scrolled");
    } else {
      this.renderer.removeClass(this.document.body, "page-scrolled");
    }
  }


}
