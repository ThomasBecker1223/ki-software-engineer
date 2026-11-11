import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorReportingService } from './error-reporting.service';

export const EXPECTED_NOT_FOUND = new HttpContextToken<boolean>(() => false);

export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const reporter = inject(ErrorReportingService);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        (error.status === 0 ||
          error.status >= 500 ||
          (error.status === 404 && !request.context.get(EXPECTED_NOT_FOUND)))
      ) {
        reporter.report(error);
      }
      return throwError(() => error);
    })
  );
};
