import {
    Directive, ElementRef, AfterViewInit,
    Input, HostListener, NgModule
} from '@angular/core';

@Directive({
    selector: '[matchHeight]'
})
export class MatchHeightDirective implements AfterViewInit {
    // class name to match height
    @Input()
    matchHeight : string;

    constructor(private el: ElementRef) {
    }

    ngAfterViewInit() {
        // call our matchHeight function here
        setTimeout(() => { this.matchHeights(this.el.nativeElement, this.matchHeight )}, 300);
    }

    matchHeights(parent: HTMLElement, className: string) {
        // match height logic here

        if (!parent) return;

        // step 1: find all the child elements with the selected class name
        const children = parent.getElementsByClassName(className);

        if (!children) return;

        //Pixinvent - Match hight - fix --- comment below code
        Array.from(children).forEach((x: HTMLElement) => {
            x.style.height = 'initial';
        });

        // step 2a: get all the child elements heights
        const itemHeights = Array.from(children)
            .map(x => x.getBoundingClientRect().height);

        // step 2b: find out the tallest
        const maxHeight = itemHeights.reduce((prev, curr) => {
            return curr > prev ? curr : prev;
        }, 0);

        // step 3: update all the child elements to the tallest height
        Array.from(children)
            .forEach((x: HTMLElement) => x.style.height = `${maxHeight}px`);
    }

    @HostListener('window:resize')
    onResize() {
        // call our matchHeight function here
        this.matchHeights(this.el.nativeElement, this.matchHeight );
    }
}

@NgModule({
    declarations: [MatchHeightDirective],
    exports: [MatchHeightDirective]
})

export class MatchHeightModule { }