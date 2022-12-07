import { RouteInfo } from './sidebar.metadata';

//Sidebar menu Routes and data
export const ROUTESHOMEDX: RouteInfo[] = [
    { path: '/.', title: 'Home', icon: 'icon-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/aboutus', title: 'menu.About us', icon: 'fas fa-info', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/undiagnosed', title: 'menu.UndiagnosedPatients', icon: 'fas fa-id-card-alt', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/diagnosed', title: 'menu.DiagnosedPatients', icon: 'fas fa-id-card', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: 'https://www.foundation29.org/donate/', title: 'homedx.Donate', icon: 'fas fa-donate', class: '', badge: '', badgeClass: '', isExternalLink: true, isAnchorLink: false, submenu: [] },
];
