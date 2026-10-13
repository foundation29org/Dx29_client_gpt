import { Injectable } from '@angular/core';
import { Subject, from, Observable } from 'rxjs';

type EventHandler = (msg: any) => void;

@Injectable({
    providedIn: 'root'
  })
export class EventsService {
  listeners: Record<string, EventHandler[]>;
  eventsSubject: Subject<{ name: string; msg: any }>;
  events: Observable<{ name: string; msg: any }>;
    constructor() {
        this.listeners = {};
        this.eventsSubject = new Subject();

        this.events = from(this.eventsSubject);

        this.events.subscribe(
            ({name, msg}: { name: string; msg: any }) => {
                if (this.listeners[name]) {
                    for (const listener of this.listeners[name]) {
                        listener(msg);
                    }
                }
            });
    }

    on(name: string, listener: EventHandler) {
        if (!this.listeners[name]) {
            this.listeners[name] = [];
        }

        this.listeners[name].push(listener);
    }

    /**
     * Elimina un listener específico para un evento
     * @param name Nombre del evento
     * @param listenerToRemove Función listener para eliminar (opcional)
     * Si no se proporciona listenerToRemove, se eliminarán todos los listeners del evento
     */
    off(name: string, listenerToRemove?: EventHandler) {
        if (!this.listeners[name]) {
            return;
        }

        if (!listenerToRemove) {
            // Si no se proporciona un listener específico, eliminar todos los listeners de este evento
            delete this.listeners[name];
            return;
        }

        // Filtrar el listener específico
        this.listeners[name] = this.listeners[name].filter(
            (listener: EventHandler) => listener !== listenerToRemove
        );
        
        // Si no quedan listeners, eliminar la clave
        if (this.listeners[name].length === 0) {
            delete this.listeners[name];
        }
    }

    broadcast(name: string, msg: any) {
        this.eventsSubject.next({
            name,
            msg
        });
    }
}
