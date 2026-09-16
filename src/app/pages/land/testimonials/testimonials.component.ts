import { Component, OnInit, AfterViewInit } from '@angular/core';

@Component({
    selector: 'app-testimonials',
    templateUrl: './testimonials.component.html',
    styleUrls: ['./testimonials.component.scss'],
    standalone: false
})

export class TestimonialsComponent implements OnInit, AfterViewInit {

    async ngAfterViewInit() {
        if (typeof document === 'undefined') return;

        // Inicializar el carousel de Bootstrap
        const myCarousel = document.getElementById('testimonialsCarousel');
        if (myCarousel) {
            const { Carousel } = await import('bootstrap');
            new Carousel(myCarousel, {
                interval: 5000,
                wrap: true
            });
        }
    }

    ngOnInit() {
        // Rest of the component initialization
    }
}

