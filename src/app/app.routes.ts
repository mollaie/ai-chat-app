import { Routes } from '@angular/router';
import { redirectUnauthorizedTo, canActivate } from '@angular/fire/auth-guard';
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['signin']);

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'chats',
    pathMatch: 'full',
  },
  {
    path: 'chats',
    loadComponent: () =>
      import('./screens/chats.component').then((m) => m.ChatsComponent),
    ...canActivate(redirectUnauthorizedToLogin),
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./screens/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'chat/:id',
        loadComponent: () =>
          import('./components/chat.component').then((m) => m.ChatComponent),
      },
    ],
  },
  {
    path: 'signin',
    loadComponent: () =>
      import('./screens/signin.component').then((m) => m.SigninComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./screens/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./screens/notfound.component').then((m) => m.NotFoundComponent),
  },
];
