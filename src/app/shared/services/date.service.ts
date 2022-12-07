import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
@Injectable()
export class DateService {

  constructor(private datePipe: DatePipe) {}

  transformDate(dates) {
    return this.datePipe.transform(dates, 'yyyy-MM-dd'); //whatever format you need.
  }

  transformFormatDate(dates, format) {
    return this.datePipe.transform(dates, format); //whatever format you need.
  }
}
