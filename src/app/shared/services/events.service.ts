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

    broadcast(name, msg) {
        this.eventsSubject.next({
            name,
            msg
        });
    }
}
