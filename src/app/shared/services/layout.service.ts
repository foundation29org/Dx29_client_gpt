import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LayoutService {

    private emitChangeSource = new Subject<any>();
    changeEmitted$ = this.emitChangeSource.asObservable();
    emitChange(change: any) {
        this.emitChangeSource.next(change);
    }


    //Customizer

    private emitCustomizerSource = new Subject<any>();
    customizerChangeEmitted$ = this.emitCustomizerSource.asObservable();
    emitCustomizerChange(change: any) {
        this.emitCustomizerSource.next(change);
    }

    //customizer - compact menu

    private emitCustomizerCMSource = new Subject<any>();
    customizerCMChangeEmitted$ = this.emitCustomizerCMSource.asObservable();
    emitCustomizerCMChange(change: any) {
        this.emitCustomizerCMSource.next(change);
    }

       //customizer - compact menu

       private emitNotiSidebarSource = new Subject<any>();
       notiSidebarChangeEmitted$ = this.emitNotiSidebarSource.asObservable();
       emitNotiSidebarChange(change: any) {
           this.emitNotiSidebarSource.next(change);
       }
}
