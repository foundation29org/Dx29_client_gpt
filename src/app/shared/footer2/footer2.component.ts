import { Component, HostBinding } from '@angular/core';

@Component({
    selector: 'app-footer2',
    templateUrl: './footer2.component.html',
    styleUrls: ['./footer2.component.scss']
})

export class Footer2Component{
    //Variables
    currentDate : Date = new Date();
}
