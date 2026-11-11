import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-book-cover',
  standalone: true,
  host: { class: 'flex h-full w-full items-center justify-center overflow-hidden bg-muted-surface' },
  template: `
    @if (src && !failed) {
      <img [src]="src" [alt]="alt" (error)="failed = true" class="h-full w-full object-contain" />
    } @else {
      <span class="text-sm font-medium text-ink-muted">No cover available</span>
    }
  `
})
export class BookCoverComponent {
  private source = '';
  protected failed = false;

  @Input() set src(value: string) {
    if (value !== this.source) this.failed = false;
    this.source = value;
  }

  get src(): string {
    return this.source;
  }

  @Input() alt = '';
}
