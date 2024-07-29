import { Component, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-termsform',
    templateUrl: './termsform.component.html',
    styleUrls: ['./termsform.component.scss']
})

export class TermFormComponent{
    @Output() termsAccepted = new EventEmitter<void>();

    constructor(public translate: TranslateService) {}
  
    onAcceptTerms() {
      this.termsAccepted.emit();
    }

}
