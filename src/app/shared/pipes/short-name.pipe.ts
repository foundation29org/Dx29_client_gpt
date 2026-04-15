import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'shortName',
    standalone: false
})
export class ShortNamePipe implements PipeTransform {
  transform(fullName: string): any {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('');
  }
}
