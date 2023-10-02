import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { _ } from 'core-js';

@Injectable({
  providedIn: "root"
})
export class CustomizerService {

  // sidebar BG colors for Light & Dark Layout
  light_dark_colors = [
    {
      code: "mint",
      class: "gradient-mint",
      active: false,
      type: 'gradient'
    },
    {
      code: "king-yna",
      class: "gradient-king-yna",
      active: false,
      type: 'gradient'
    },
    {
      code: "ibiza-sunset",
      class: "gradient-ibiza-sunset",
      active: false,
      type: 'gradient'
    },
    {
      code: "flickr",
      class: "gradient-flickr",
      active: false,
      type: 'gradient'
    },
    {
      code: "purple-bliss",
      class: "gradient-purple-bliss",
      active: false,
      type: 'gradient'
    },
    {
      code: "man-of-steel",
      class: "gradient-man-of-steel",
      active: false,
      type: 'gradient'
    },
    {
      code: "purple-love",
      class: "gradient-purple-love",
      active: false,
      type: 'gradient'
    },
    {
      code: "black",
      class: "bg-black",
      active: false,
      type: 'solid'
    },
    {
      code: "white",
      class: "bg-grey",
      active: false,
      type: 'solid'
    },
    {
      code: "primary",
      class: "bg-primary",
      active: false,
      type: 'solid'
    },
    {
      code: "success",
      class: "bg-success",
      active: false,
      type: 'solid'
    },
    {
      code: "warning",
      class: "bg-warning",
      active: false,
      type: 'solid'
    },
    {
      code: "info",
      class: "bg-info",
      active: false,
      type: 'solid'
    },
    {
      code: "danger",
      class: "bg-danger",
      active: false,
      type: 'solid'
    }
  ];

  // sidebar BG colors for Transparent Layout
  transparent_colors = [
    {
      class: "bg-glass-hibiscus",
      active: false
    },
    {
      class: "bg-glass-purple-pizzazz",
      active: false
    },
    {
      class: "bg-glass-blue-lagoon",
      active: false
    },
    {
      class: "bg-glass-electric-violet",
      active: false
    },
    {
      class: "bg-glass-portage",
      active: false
    },
    {
      class: "bg-glass-tundora",
      active: false
    }
  ];

  // sidebar BG images for Light & Dark Layout
  light_dark_bg_images = [
    {
      src: "assets/img/sidebar-bg/01.jpg",
      active: false
    },
    {
      src: "assets/img/sidebar-bg/02.jpg",
      active: false
    },
    {
      src: "assets/img/sidebar-bg/03.jpg",
      active: false
    },
    {
      src: "assets/img/sidebar-bg/04.jpg",
      active: false
    },
    {
      src: "assets/img/sidebar-bg/05.jpg",
      active: false
    },
    {
      src: "assets/img/sidebar-bg/06.jpg",
      active: false
    },
  ];

  // Background Colors with Shades for Transparent Layout
  transparent_colors_with_shade = [
    {
      class: "bg-glass-1",
      active: false
    },
    {
      class: "bg-glass-2",
      active: false
    },
    {
      class: "bg-glass-3",
      active: false
    },
    {
      class: "bg-glass-4",
      active: false
    },
  ];

  lightDarkLayoutGradientBGColors: any = [];
  lightDarkLayoutSolidBGColors: any = [];
  transparentLayoutBGColors: any = [];
  transparentLayoutBGColorsWithShades: any = [];
  lightDarkLayoutBGImages: any = [];


  constructor(private config: ConfigService) {
    this.getData();
  }

  getData() {
    this.lightDarkLayoutGradientBGColors = this.getlightDarkLayoutGradientBGColors();
    this.lightDarkLayoutSolidBGColors = this.getlightDarkLayoutSolidBGColors();
    this.transparentLayoutBGColors = this.getTransparentLayoutBGColors();
    this.transparentLayoutBGColorsWithShades = this.GetTransparentLayoutBGColorsWithShades();
    this.lightDarkLayoutBGImages = this.getLightDarkLayoutBGImages();
  }

  getlightDarkLayoutGradientBGColors() {
    return this.light_dark_colors.filter(_ => _.type === 'gradient')
      .map(color => {
        color.active = (color.code === this.config.templateConf.layout.sidebar.backgroundColor);
        return { ...color };
      });
  }

  getlightDarkLayoutSolidBGColors() {
    return this.light_dark_colors.filter(_ => _.type === 'solid')
      .map(color => {
        color.active = (color.code === this.config.templateConf.layout.sidebar.backgroundColor);
        return { ...color };
      });
  }

  getTransparentLayoutBGColors() {
    return this.transparent_colors
      .map(color => {
        color.active = (color.class === this.config.templateConf.layout.sidebar.backgroundColor);
        return { ...color };
      });
  }

  GetTransparentLayoutBGColorsWithShades() {
    return this.transparent_colors_with_shade
      .map(color => {
        color.active = (color.class === this.config.templateConf.layout.sidebar.backgroundColor);
        return { ...color };
      });
  }

  getLightDarkLayoutBGImages() {
    return this.light_dark_bg_images
      .map(image => {
        image.active = (image.src === this.config.templateConf.layout.sidebar.backgroundImageURL);
        return { ...image };
      });
  }



  //called when click to change on any Gradient/Solid color for Light & Dark layout in customizer
  changeSidebarBGColor(color) {

    let conf = this.config.templateConf;
    conf.layout.sidebar.backgroundColor = color.code;

    this.config.applyTemplateConfigChange({ layout: conf.layout });

    this.getData();

  }

  //called when click to change on any Transparent color for Transparent layout in customizer
  changeSidebarTransparentBGColor(color) {

    let conf = this.config.templateConf;
    conf.layout.sidebar.backgroundColor = color.class;
    conf.layout.sidebar.backgroundImage = false;
    conf.layout.sidebar.backgroundImageURL = '';

    this.config.applyTemplateConfigChange({ layout: conf.layout });

    this.getData();
  }


  //called when click to change on any image for Light & Dark layout in customizer
  changeSidebarBgImage(image) {

    let conf = this.config.templateConf;
    conf.layout.sidebar.backgroundImageURL = image.src;

    this.config.applyTemplateConfigChange({ layout: conf.layout });

    this.getData();

  }

  bgImageDisplay(e: any) {
    let conf = this.config.templateConf;
    if (e.target.checked) {
      conf.layout.sidebar.backgroundImage = true;
    } else {
      conf.layout.sidebar.backgroundImage = false;
    }

    this.config.applyTemplateConfigChange({ layout: conf.layout });
  }

  toggleCompactMenu(e: any) {
    let conf = this.config.templateConf;
    if (e.target.checked) {
      conf.layout.sidebar.collapsed = true;
    } else {
      conf.layout.sidebar.collapsed = false;
    }

    this.config.applyTemplateConfigChange({ layout: conf.layout });
  }


  changeSidebarWidth(value: string) {
    let conf = this.config.templateConf;
    conf.layout.sidebar.size = value;
    this.config.applyTemplateConfigChange({ layout: conf.layout });
  }

  toggleNavbarType(value: string) {
    let conf = this.config.templateConf;
    conf.layout.navbar.type = value;
    this.config.applyTemplateConfigChange({ layout: conf.layout });
  }

  // position: "Side" for vertical menu and position: "Top" for horizontal menu
  toggleMenuPosition(position: string) {
    let conf = this.config.templateConf;
    conf.layout.menuPosition = position;
    this.config.applyTemplateConfigChange({ layout: conf.layout });
  }

  switchLayout(layout: string, isBgImageDisplay: boolean) {
    let conf = this.config.templateConf;
    if(layout.toLowerCase() === 'light') {
      conf.layout.variant = 'Light';
      conf.layout.sidebar.backgroundImageURL = this.light_dark_bg_images[0].src;
      conf.layout.sidebar.backgroundColor = this.light_dark_colors[5].code;
      conf.layout.sidebar.backgroundImage = isBgImageDisplay;
    }
    else if(layout.toLowerCase() === 'dark') {
      conf.layout.variant = 'Dark';
      conf.layout.sidebar.backgroundImageURL = this.light_dark_bg_images[2].src;
      conf.layout.sidebar.backgroundColor = this.light_dark_colors[7].code;
      conf.layout.sidebar.backgroundImage = isBgImageDisplay;
    }
    else if(layout.toLowerCase() === 'transparent') {

      conf.layout.variant = 'Transparent';
      conf.layout.sidebar.backgroundImageURL = "";
      conf.layout.sidebar.backgroundColor = this.transparent_colors_with_shade[0].class;
    }

    this.config.applyTemplateConfigChange({ layout: conf.layout });

    this.getData();
  }


}
