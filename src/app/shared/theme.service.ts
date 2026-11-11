import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark';
const STORAGE_KEY = 'bookmonkey.theme';

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly selected = signal<ThemePreference>('light');
  private initialized = false;

  readonly preference = this.selected.asReadonly();

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.setPreference(this.readSavedPreference() ?? this.readSystemPreference());
  }

  setPreference(value: string): void {
    if (!isThemePreference(value)) return;
    this.selected.set(value);
    this.apply(value);
    this.savePreference(value);
  }

  private readSavedPreference(): ThemePreference | undefined {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return isThemePreference(stored) ? stored : undefined;
    } catch {
      // Restricted storage must not prevent using the theme selector.
      return undefined;
    }
  }

  private readSystemPreference(): ThemePreference {
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private savePreference(value: ThemePreference): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Retain the selection for this session when persistence is unavailable.
    }
  }

  private apply(theme: ThemePreference): void {
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.style.colorScheme = theme;
  }
}
