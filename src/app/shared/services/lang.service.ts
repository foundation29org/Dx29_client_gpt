import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class LangService {

    langs: any = [];
    
    // Lista de idiomas válidos (debe coincidir con la lista en navbar-dx29.component.ts)
    private static readonly VALID_LANG_CODES = ['de', 'en', 'es', 'fr', 'pl', 'ru', 'uk', 'ca'];

    constructor(public translate : TranslateService, private http: HttpClient, public insightsService: InsightsService) {}


    getLangs(){
      //load the available languages
      return this.http.get(environment.api+'/internal/langs')
        .pipe(
          map((res: any) => {
            this.langs = res;
            return res;
          }),
          catchError((err) => {
            console.log(err);
            this.insightsService.trackException(err);
            return err;
          })
        );
    }

    /**
     * Obtiene el idioma de localStorage de forma segura, validando que sea válido
     * Si el valor es inválido (undefined, null, o no está en la lista), retorna 'en' como fallback
     * y limpia el valor inválido del localStorage
     * @returns Código de idioma válido (por defecto 'en')
     */
    static getValidLangFromStorage(): string {
        const storedLang = localStorage.getItem('lang');
        
        // Validar que el valor no sea null, undefined (string), null (string), o vacío
        if (!storedLang || storedLang === 'undefined' || storedLang === 'null' || storedLang.trim() === '') {
            // Limpiar valor inválido si existe
            if (storedLang) {
                localStorage.removeItem('lang');
            }
            return 'en';
        }
        
        // Validar que el código esté en la lista de idiomas válidos
        if (LangService.VALID_LANG_CODES.includes(storedLang)) {
            return storedLang;
        }
        
        // Si no es válido, limpiarlo y retornar 'en'
        localStorage.removeItem('lang');
        return 'en';
    }
}
