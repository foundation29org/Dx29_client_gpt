import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { from } from 'rxjs';

@Injectable({
    providedIn: 'root'
  })
export class EventsService {
  listeners: any;
  eventsSubject: any;
  events: any;
    constructor() {
        this.listeners = {};
        this.eventsSubject = new Subject();

        this.events = from(this.eventsSubject);

        this.events.subscribe(
            ({name, msg}) => {
                if (this.listeners[name]) {
                    for (const listener of this.listeners[name]) {
                        listener(msg);
                    }
                }
            });
    }

    on(name, listener) {
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
    off(name, listenerToRemove?) {
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
            listener => listener !== listenerToRemove
        );
        
        // Si no quedan listeners, eliminar la clave
        if (this.listeners[name].length === 0) {
            delete this.listeners[name];
        }
    }

    broadcast(name, msg) {
        this.eventsSubject.next({
            name,
            msg
        });
    }
}
