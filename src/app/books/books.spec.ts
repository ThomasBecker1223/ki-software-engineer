import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ApplicationErrorHandler, ErrorReportingService } from '../shared/error-reporting.service';
import { httpErrorInterceptor } from '../shared/http-error.interceptor';
import { BookApiClient } from './book-api-client.service';
import { BOOK_API_URL } from './book-api.config';
import { BookListComponent } from './book-list.component';
import { BookDetailsComponent } from './book-details.component';
import { BookCoverComponent } from './book-cover.component';

const apiUrl = '/test-api/books';

describe('book HTTP boundaries', () => {
  let http: HttpTestingController;
  let client: BookApiClient;
  let diagnostics: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: BOOK_API_URL, useValue: apiUrl },
        { provide: ErrorHandler, useClass: ApplicationErrorHandler }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(BookApiClient);
    diagnostics = spyOn(console, 'error');
  });

  afterEach(() => http.verify());

  it('uses the configured endpoint and encodes IDs', () => {
    client.getBook('a/b').subscribe(book => expect(book.id).toBe('a/b'));
    http.expectOne(apiUrl + '/a%2Fb').flush({ id: 'a/b' });
  });

  it('keeps expected detail 404s local and preserves the original error', () => {
    const onError = jasmine.createSpy('onError');
    client.getBook('missing').subscribe({ error: onError });
    http.expectOne(apiUrl + '/missing').flush({}, { status: 404, statusText: 'Not Found' });
    expect(onError.calls.mostRecent().args[0].status).toBe(404);
    expect(diagnostics).not.toHaveBeenCalled();
  });

  for (const status of [0, 500]) {
    it('reports a ' + status + ' failure once while preserving it for recovery', () => {
      let received: unknown;
      client.getBooks().subscribe({ error: error => (received = error) });
      const request = http.expectOne(apiUrl + '?_limit=10');
      if (status === 0) request.error(new ProgressEvent('error'));
      else request.flush({}, { status, statusText: 'Server Error' });
      expect(received).toBeDefined();
      TestBed.inject(ErrorHandler).handleError(received);
      expect(diagnostics).toHaveBeenCalledTimes(1);
      expect(diagnostics.calls.mostRecent().args[1]).toBe(received);
    });
  }

  it('routes uncaught exceptions through the same reporter', () => {
    const reporter = spyOn(TestBed.inject(ErrorReportingService), 'report');
    const error = new Error('unexpected');
    TestBed.inject(ErrorHandler).handleError(error);
    expect(reporter).toHaveBeenCalledOnceWith(error);
  });
});

describe('book list query ownership', () => {
  let fixture: ComponentFixture<BookListComponent>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: BOOK_API_URL, useValue: apiUrl }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BookListComponent);
    fixture.detectChanges();
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  it('cancels the previous HTTP request as soon as typing starts', fakeAsync(() => {
    const previous = http.expectOne(apiUrl + '?_limit=10');
    fixture.componentInstance.onSearchChange('new');
    expect(previous.cancelled).toBeTrue();
    tick(299);
    http.expectNone(request => request.params.has('q'));
    tick(1);
    http.expectOne(apiUrl + '?_limit=10&q=new').flush([]);
  }));

  it('clears a pending debounce with one immediate unfiltered request', fakeAsync(() => {
    http.expectOne(apiUrl + '?_limit=10').flush([]);
    fixture.componentInstance.onSearchChange('pending');
    fixture.componentInstance.clearSearch();
    http.expectOne(apiUrl + '?_limit=10').flush([]);
    tick(300);
    http.expectNone(() => true);
    expect(fixture.componentInstance.searchTerm).toBe('');
  }));

  it('reloads when pageSize changes', () => {
    const previous = http.expectOne(apiUrl + '?_limit=10');
    fixture.componentRef.setInput('pageSize', 20);
    fixture.detectChanges();
    expect(previous.cancelled).toBeTrue();
    http.expectOne(apiUrl + '?_limit=20').flush([]);
  });

  it('shows an error rather than an empty list and allows retry', () => {
    http.expectOne(apiUrl + '?_limit=10').flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Unable to load books');
    expect(fixture.nativeElement.textContent).not.toContain('No books available');
    fixture.componentInstance.retry();
    http.expectOne(apiUrl + '?_limit=10').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No books available');
  });

  it('cancels an active request when destroyed', () => {
    const request = http.expectOne(apiUrl + '?_limit=10');
    fixture.destroy();
    expect(request.cancelled).toBeTrue();
  });

  it('cancels pending debounce work when destroyed', fakeAsync(() => {
    http.expectOne(apiUrl + '?_limit=10').flush([]);
    fixture.componentInstance.onSearchChange('pending');
    const getBooks = spyOn(TestBed.inject(BookApiClient), 'getBooks').and.callThrough();
    fixture.destroy();
    tick(300);
    http.expectNone(() => true);
    expect(getBooks).not.toHaveBeenCalled();
  }));
});

describe('detail request lifetime', () => {
  it('cancels the exact previous request on ID changes and destruction', () => {
    const params = new BehaviorSubject(convertToParamMap({ id: '1' }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: BOOK_API_URL, useValue: apiUrl },
        { provide: ActivatedRoute, useValue: { paramMap: params } }
      ]
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(BookDetailsComponent);
    fixture.detectChanges();
    const first = http.expectOne(apiUrl + '/1');
    params.next(convertToParamMap({ id: '2' }));
    expect(first.cancelled).toBeTrue();
    const second = http.expectOne(apiUrl + '/2');
    fixture.destroy();
    expect(second.cancelled).toBeTrue();
    http.verify({ ignoreCancelled: true });
  });
});

describe('shared book cover', () => {
  it('recovers from a broken image when its URL changes on the same instance', () => {
    const fixture = TestBed.createComponent(BookCoverComponent);
    fixture.componentRef.setInput('src', '/broken.png');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No cover available');
    fixture.componentRef.setInput('src', '/valid.png');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('/valid.png');
    expect(fixture.nativeElement.textContent).not.toContain('No cover available');
  });
});
