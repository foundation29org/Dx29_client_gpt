import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Carousel } from 'bootstrap';

@Component({
    selector: 'app-testimonials',
    templateUrl: './testimonials.component.html',
    styleUrls: ['./testimonials.component.scss']
})

export class TestimonialsComponent implements OnInit, AfterViewInit {

    ngAfterViewInit() {
        // Inicializar el carousel de Bootstrap
        const myCarousel = document.getElementById('testimonialsCarousel');
        if (myCarousel) {
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

