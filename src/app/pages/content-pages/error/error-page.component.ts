import { Component, OnInit } from '@angular/core';
import { Router , ActivatedRoute} from "@angular/router";
import {Location} from '@angular/common';

@Component({
    selector: 'app-error-page',
    templateUrl: './error-page.component.html',
    styleUrls: ['./error-page.component.scss']
})

export class ErrorPageComponent {
  constructor(private router: Router, private route: ActivatedRoute, private _location: Location) { }

  // On goHome link click
  goHome() {
      //this.router.navigate(['/']);
      //window.history.back();
      this._location.back();
  }

}
