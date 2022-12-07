import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject } from "rxjs";
import { TemplateConfig } from "../template-config/config.interface";

@Injectable({
  providedIn: "root"
})
export class ConfigService {
  public templateConf: TemplateConfig;

  constructor() {
    this.setConfigValue();
  }

  setConfigValue() {
    this.templateConf = {
      layout: {
        variant: "Light", // options:  Dark, Light & Transparent
        dir: "ltr", //Options: ltr, rtl
        customizer: {
          hidden: true //options: true, false
        },
        sidebar: {
          collapsed: false, //options: true, false
          size: "sidebar-lg", // Options: 'sidebar-lg', 'sidebar-md', 'sidebar-sm'
          backgroundColor: "bg-glass-2", // Options: 'black', 'pomegranate', 'king-yna', 'ibiza-sunset', 'flickr', 'purple-bliss', 'man-of-steel', 'purple-love'

          /* If you want transparent layout add any of the following mentioned classes to backgroundColor of sidebar option :
            bg-glass-1, bg-glass-2, bg-glass-3, bg-glass-4, bg-hibiscus, bg-purple-pizzaz, bg-blue-lagoon, bg-electric-viloet, bg-protage, bg-tundora
          */
          backgroundImage: false, // Options: true, false | Set true to show background image
          backgroundImageURL: "assets/img/sidebar-bg/01.jpg"
        }
      }
    };
  }
}
