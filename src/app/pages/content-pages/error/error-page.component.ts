import { Component } from '@angular/core';
import {Location} from '@angular/common';

@Component({
    selector: 'app-error-page',
    templateUrl: './error-page.component.html',
    styleUrls: ['./error-page.component.scss']
})

export class ErrorPageComponent {
  constructor(private _location: Location) { }

  // On goHome link click
  goHome() {
      //this.router.navigate(['/']);
      //window.history.back();
      this._location.back();
  }

}
