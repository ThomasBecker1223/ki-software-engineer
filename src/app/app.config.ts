import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { BOOK_API_URL, DEFAULT_BOOK_API_URL } from './books/book-api.config';
import { ApplicationErrorHandler } from './shared/error-reporting.service';
import { httpErrorInterceptor } from './shared/http-error.interceptor';
import { ThemeService } from './shared/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => inject(ThemeService).initialize()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: BOOK_API_URL, useValue: DEFAULT_BOOK_API_URL },
    { provide: ErrorHandler, useClass: ApplicationErrorHandler },
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    provideAnimations()
  ]
};
