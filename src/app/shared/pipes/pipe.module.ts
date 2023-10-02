import { NgModule } from '@angular/core';
import {CommonModule} from "@angular/common";

import { FilterPipe } from './filter.pipe';
import { SearchPipe } from './search.pipe';
import { ShortNamePipe } from './short-name.pipe';
import { SafePipe } from './safe.pipe';

@NgModule({
  declarations:[FilterPipe, SearchPipe, ShortNamePipe, SafePipe],
  imports:[CommonModule],
  exports:[FilterPipe, SearchPipe, ShortNamePipe, SafePipe]
})

export class PipeModule{}
