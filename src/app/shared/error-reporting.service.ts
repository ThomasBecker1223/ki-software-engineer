import { ErrorHandler, Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorReportingService {
  private readonly reported = new WeakSet<object>();

  report(error: unknown): void {
    if (typeof error === 'object' && error !== null) {
      if (this.reported.has(error)) return;
      this.reported.add(error);
    }
    console.error('Unexpected application error:', error);
  }
}

@Injectable()
export class ApplicationErrorHandler implements ErrorHandler {
  private readonly reporter = inject(ErrorReportingService);

  handleError(error: unknown): void {
    this.reporter.report(error);
  }
}
