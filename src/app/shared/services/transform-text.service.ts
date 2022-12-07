import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'texttrasnsform'
})

@Injectable()
export class TextTransform implements PipeTransform {

    transform(value: any): any {
        if (!value) return value;
        return value[0].toUpperCase() + value.substr(1).toLowerCase();;
    }
}
