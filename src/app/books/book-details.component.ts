import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, startWith, Subject, switchMap } from 'rxjs';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookCoverComponent } from './book-cover.component';
import { RequestErrorComponent } from './request-error.component';

type BookDetailsState = { status: 'loading' | 'not-found' | 'error' } | { status: 'success'; book: Book };

@Component({
  selector: 'app-book-details',
  imports: [AsyncPipe, RouterLink, BookCoverComponent, RequestErrorComponent],
  templateUrl: './book-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly bookApiClient = inject(BookApiClient);
  private readonly retryRequests = new Subject<void>();

  readonly state$ = this.route.paramMap.pipe(
    map(params => params.get('id')!),
    distinctUntilChanged(),
    switchMap(id =>
      this.retryRequests.pipe(
        startWith(undefined),
        switchMap(() =>
          this.bookApiClient.getBook(id).pipe(
            map((book): BookDetailsState => ({ status: 'success', book })),
            catchError((error: HttpErrorResponse) =>
              of<BookDetailsState>({ status: error.status === 404 ? 'not-found' : 'error' })
            ),
            startWith<BookDetailsState>({ status: 'loading' })
          )
        )
      )
    )
  );

  retry(): void {
    this.retryRequests.next();
  }
}
