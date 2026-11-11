import { InjectionToken } from '@angular/core';

export const DEFAULT_BOOK_API_URL = 'http://localhost:4730/books';
export const BOOK_API_URL = new InjectionToken<string>('Book API URL');
