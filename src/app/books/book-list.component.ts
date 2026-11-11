import { AsyncPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, catchError, combineLatest, map, of, startWith, switchMap, timer } from 'rxjs';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookItemComponent } from './book-item.component';
import { RequestErrorComponent } from './request-error.component';

type BookListState = { status: 'loading' | 'error' } | { status: 'success'; books: Book[] };

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [AsyncPipe, FormsModule, BookItemComponent, RequestErrorComponent],
  templateUrl: './book-list.component.html'
})
export class BookListComponent {
  private readonly bookApiClient = inject(BookApiClient);
  private readonly pageSizes = new BehaviorSubject(10);
  private readonly searches = new BehaviorSubject({ term: '', debounce: false });

  @Input() set pageSize(value: number) {
    if (value !== this.pageSizes.value) this.pageSizes.next(value);
  }

  get pageSize(): number {
    return this.pageSizes.value;
  }

  searchTerm = '';

  readonly state$ = combineLatest([this.searches, this.pageSizes]).pipe(
    switchMap(([query, pageSize]) =>
      (query.debounce ? timer(300) : of(0)).pipe(
        switchMap(() => this.bookApiClient.getBooks(pageSize, query.term)),
        map((books): BookListState => ({ status: 'success', books })),
        catchError(() => of<BookListState>({ status: 'error' })),
        startWith<BookListState>({ status: 'loading' })
      )
    )
  );

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searches.next({ term, debounce: term.length > 0 });
  }

  clearSearch(): void {
    this.onSearchChange('');
  }

  retry(): void {
    this.searches.next({ term: this.searchTerm, debounce: false });
  }
}
