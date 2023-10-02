import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchTerm: string, labelKey?: string): any {
    if (!items || !searchTerm) {
      return null;
    }

    return items.filter(
      item =>
        item[labelKey || 'name']
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) === true
    ).slice(0,10);
  }
}
