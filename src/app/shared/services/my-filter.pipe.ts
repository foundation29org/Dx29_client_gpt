import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'myfilter',
})

export class MyFilterPipe implements PipeTransform {
  transform(items: any[], filter: String): any {
      if (!items || !filter) {
          return items;
      }
      // filter items array, items which match and return true will be
      // kept, false will be filtered out
      return items.filter(item => item.toLowerCase().indexOf(filter.toLowerCase()) !== -1);
  }
}
