import { Component, Input, output } from '@angular/core';

@Component({
  selector: 'app-request-error',
  standalone: true,
  template: `
    <div role="alert" class="rounded-lg bg-muted-surface p-8">
      <h1 class="mb-2 text-2xl font-bold text-ink">{{ title }}</h1>
      <p class="text-ink-muted">{{ message }}</p>
      @if (retryable) {
        <button
          type="button"
          (click)="retry.emit()"
          class="mt-4 rounded-md bg-action px-4 py-2 font-medium text-white hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Retry
        </button>
      }
    </div>
  `
})
export class RequestErrorComponent {
  @Input({ required: true }) title = '';
  @Input() message = 'Please try again.';
  @Input() retryable = true;
  readonly retry = output<void>();
}
