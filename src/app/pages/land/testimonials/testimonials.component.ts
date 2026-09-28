import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-testimonials',
    templateUrl: './testimonials.component.html',
    styleUrls: ['./testimonials.component.scss'],
    standalone: false
})

export class TestimonialsComponent implements OnInit, AfterViewInit, OnDestroy {

    paused = false;
    private carouselElement: HTMLElement | null = null;
    private carouselCtor: any = null;
    private carousel: any = null;

    async ngAfterViewInit() {
        if (typeof document === 'undefined') return;

        // Inicializar el carousel de Bootstrap
        const myCarousel = document.getElementById('testimonialsCarousel');
        if (myCarousel) {
            const { Carousel } = await import('bootstrap');
            this.carouselElement = myCarousel;
            this.carouselCtor = Carousel;
            this.createCarousel();
        }
    }

    ngOnInit() {
        // Rest of the component initialization
    }

    ngOnDestroy() {
        this.carousel?.dispose();
    }

    togglePause() {
        this.paused = !this.paused;
        this.createCarousel();
    }

    private createCarousel() {
        if (!this.carouselElement || !this.carouselCtor) return;
        this.carouselCtor.getInstance(this.carouselElement)?.dispose();
        this.carousel = new this.carouselCtor(this.carouselElement, {
            interval: 5000,
            wrap: true,
            ride: this.paused ? false : 'carousel'
        });
    }
}
