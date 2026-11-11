import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from './book';
import { BookCoverComponent } from './book-cover.component';

@Component({
  selector: 'app-book-item',
  standalone: true,
  imports: [RouterLink, BookCoverComponent],
  template: `
    <a
      [routerLink]="['/books', book.id]"
      [attr.aria-label]="'View details for ' + book.title"
      class="bg-surface rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <div class="relative aspect-[3/4] overflow-hidden">
        <app-book-cover [src]="book.cover" [alt]="book.title" />
      </div>
      <div class="p-5 flex flex-col flex-grow">
        <h2 class="text-lg font-semibold text-ink mb-1 line-clamp-2">{{ book.title }}</h2>
        @if (book.subtitle) {
          <p class="text-sm text-ink-muted mb-2 line-clamp-2">{{ book.subtitle }}</p>
        }
        <div class="text-sm text-ink mt-auto">
          <p>
            <span class="text-accent">{{ book.author }}</span>
          </p>
          @if (book.isbn) {
            <p class="text-xs text-ink-muted mt-2">ISBN: {{ book.isbn }}</p>
          }
        </div>
      </div>
    </a>
  `
})
export class BookItemComponent {
  @Input() book!: Book;
}
