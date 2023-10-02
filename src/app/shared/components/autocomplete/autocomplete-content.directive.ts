import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appAutocompleteContent]'
})
export class AutocompleteContentDirective {
  constructor( public tpl: TemplateRef<any> ) {
  }
}
