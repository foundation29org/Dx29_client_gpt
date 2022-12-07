import { Injectable } from '@angular/core';
@Injectable()
export class SearchService {

  constructor() {}

  search(items: any[], field: string, value: string): boolean {
    if (!items) return false;

    var element = items.filter(it => it[field] == value);
    if(element.length > 0 ){
      return true;
    }else{
      return false
    }

  }

  search2Levels(items: any[], field: string, field2: string, value: string): boolean {
    if (!items) return false;

    var element = items.filter(it => it[field][field2] == value);
    if(element.length > 0 ){
      return true;
    }else{
      return false
    }

  }

  searchIndex(items: any[], field: string, value: string): number {
    if (!items) return -1;
    var index = items.findIndex(it => it[field] == value);
    return index;

  }

  searchIndexLevel2(items: any[], field: string, field2: string, value: string): number {
    if (!items) return -1;
    var index = items.findIndex(it => it[field][field2] == value);
    return index;

  }


}
