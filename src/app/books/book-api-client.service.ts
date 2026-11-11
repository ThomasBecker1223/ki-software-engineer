import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Book } from './book';
import { BOOK_API_URL } from './book-api.config';
import { EXPECTED_NOT_FOUND } from '../shared/http-error.interceptor';

@Injectable({ providedIn: 'root' })
export class BookApiClient {
  constructor(
    private http: HttpClient,
    @Inject(BOOK_API_URL) private readonly apiUrl: string
  ) {}

  getBook(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${encodeURIComponent(id)}`, {
      context: new HttpContext().set(EXPECTED_NOT_FOUND, true)
    });
  }

  getBooks(pageSize: number = 10, searchTerm?: string): Observable<Book[]> {
    let params = new HttpParams().set('_limit', pageSize.toString());

    if (searchTerm) {
      // Search in title and author fields
      params = params.set('q', searchTerm);
    }

    return this.http.get<Book[]>(this.apiUrl, { params });
  }
}
