import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    redirectTo: 'clientes',
    pathMatch: 'full',
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'clientes',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'galeria',
        loadComponent: () => import('./gallery/gallery.page').then((m) => m.GalleryPage),
      },
    ],
  },
];
