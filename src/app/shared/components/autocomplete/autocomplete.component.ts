import { Component, ContentChild, ContentChildren, QueryList, TemplateRef, ViewChild } from '@angular/core';
import { AutocompleteContentDirective } from './autocomplete-content.directive';
import { OptionComponent } from './option/option.component';
import { switchMap } from 'rxjs/operators';
import { merge } from 'rxjs';

@Component({
  selector: 'app-autocomplete',
  template: `
    <ng-template #root>
      <div class="autocomplete search-list" >
        <ng-container *ngTemplateOutlet="content ? content.tpl : null"></ng-container>
      </div>
    </ng-template>
  `,
  exportAs: 'appAutocomplete',
  styleUrls: ['./autocomplete.component.css']
})
export class AutocompleteComponent {
  @ViewChild('root') rootTemplate: TemplateRef<any>;

  @ContentChild(AutocompleteContentDirective)
  content: AutocompleteContentDirective;

  @ContentChildren(OptionComponent) options: QueryList<OptionComponent>;

  optionsClick() {
    return this.options.changes.pipe(
      switchMap(options => {
        const clicks$ = options.map(option => option.click$);
        return merge(...clicks$);
      })
    );
  }
}
