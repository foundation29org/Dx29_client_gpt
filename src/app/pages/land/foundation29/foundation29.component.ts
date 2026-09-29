import { Component, OnInit } from '@angular/core';

const FOUNDATION29_URL = 'https://foundation29.org';

@Component({
    selector: 'app-foundation29',
    templateUrl: './foundation29.component.html',
    styleUrls: ['./foundation29.component.scss'],
    standalone: false
})
export class Foundation29Component implements OnInit {

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.location.replace(FOUNDATION29_URL);
    }
  }
}
