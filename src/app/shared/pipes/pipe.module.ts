import { NgModule } from '@angular/core';
import {CommonModule} from "@angular/common";

import { FilterPipe } from './filter.pipe';
import { SearchPipe } from './search.pipe';
import { ShortNamePipe } from './short-name.pipe';

@NgModule({
  declarations:[FilterPipe, SearchPipe, ShortNamePipe],
  imports:[CommonModule],
  exports:[FilterPipe, SearchPipe, ShortNamePipe]
})

export class PipeModule{}
