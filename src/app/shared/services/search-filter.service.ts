import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
 name: 'searchfilter'
})

@Injectable()
export class SearchFilterPipe implements PipeTransform {
 transform(items: any[], field: string, value: string): any[] {
   if (!items) return [];
   return items.filter(it => it[field].normalize("NFD").replace(/[\u0300-\u036f]/g, "") == value.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
 }

 transformDiseases(items: any[], field: string, value: string): any[] {
   if (!items) {return [];}
   var resul = [];
   for(var i = 0; i < items.length; i++) {
     var temp = (items[i][field].toLowerCase()).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
     if(temp.indexOf(value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) != -1){
       var tempchar = items[i].name.slice(-1);
       if(tempchar=='.'){
         var newStr = items[i].name.slice(0, -1);
         items[i].name = newStr;
       }
       resul.push(items[i]);
     }else{
       var enc = false;
       for(var j = 0; j < items[i].synonyms.length && !enc; j++) {
         var temp2 = (items[i].synonyms[j].toLowerCase()).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
         if(temp2.indexOf(value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) != -1){
           enc = true;
           //items[i].name = items[i].name + ' (Synonym: '+ items[i].synonyms[j]+')';
           resul.push(items[i]);
         }
       }

     }
   }
   return resul;
 }
}
