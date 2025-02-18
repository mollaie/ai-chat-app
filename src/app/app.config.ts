import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { setLogLevel, LogLevel } from '@angular/fire';

setLogLevel(LogLevel.VERBOSE);
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'angular-ai-chat-app',
        appId: '1:575905824492:web:c8f6131716b1ed919fafc9',
        storageBucket: 'angular-ai-chat-app.firebasestorage.app',
        apiKey: 'AIzaSyDgJWCDWH6tSBEIoT710vrHa3qWKT1HiNY',
        authDomain: 'angular-ai-chat-app.firebaseapp.com',
        messagingSenderId: '575905824492',
        measurementId: 'G-396WWNH71Y',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideAnimationsAsync(),
  ],
};
