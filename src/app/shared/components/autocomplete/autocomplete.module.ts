import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutocompleteComponent } from './autocomplete.component';
import { AutocompleteDirective } from './autocomplete.directive';
import { AutocompleteContentDirective } from './autocomplete-content.directive';
import { OptionComponent } from './option/option.component';

const publicApi = [
  AutocompleteComponent,
  AutocompleteDirective,
  AutocompleteContentDirective,
  OptionComponent
];

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [publicApi],
  exports: [publicApi]
})
export class AutocompleteModule {
}
