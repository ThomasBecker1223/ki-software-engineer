import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('theme preference', () => {
  let dark: boolean;
  let previousPreference: string | null;
  let previousTheme: string | undefined;
  let previousColorScheme: string;

  beforeEach(() => {
    previousPreference = localStorage.getItem('bookmonkey.theme');
    previousTheme = document.documentElement.dataset['theme'];
    previousColorScheme = document.documentElement.style.colorScheme;
    localStorage.removeItem('bookmonkey.theme');
    dark = false;
    spyOn(window, 'matchMedia').and.callFake(() => ({ matches: dark }) as MediaQueryList);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    if (previousPreference === null) localStorage.removeItem('bookmonkey.theme');
    else localStorage.setItem('bookmonkey.theme', previousPreference);
    if (previousTheme === undefined) delete document.documentElement.dataset['theme'];
    else document.documentElement.dataset['theme'] = previousTheme;
    document.documentElement.style.colorScheme = previousColorScheme;
  });

  it('THEME-01: reads the system default once and persists the resolved mode', () => {
    dark = true;
    const theme = TestBed.inject(ThemeService);
    theme.initialize();
    dark = false;
    theme.initialize();
    expect(window.matchMedia).toHaveBeenCalledOnceWith('(prefers-color-scheme: dark)');
    expect(theme.preference()).toBe('dark');
    expect(localStorage.getItem('bookmonkey.theme')).toBe('dark');
  });

  it('THEME-02: restores a saved choice without consulting the system', () => {
    localStorage.setItem('bookmonkey.theme', 'dark');
    const theme = TestBed.inject(ThemeService);
    theme.initialize();
    expect(theme.preference()).toBe('dark');
    expect(window.matchMedia).not.toHaveBeenCalled();
    theme.setPreference('light');
    expect(theme.preference()).toBe('light');
    expect(localStorage.getItem('bookmonkey.theme')).toBe('light');
  });

  it('migrates the former system option to a persisted light or dark mode', () => {
    localStorage.setItem('bookmonkey.theme', 'system');
    dark = true;
    const theme = TestBed.inject(ThemeService);
    theme.initialize();
    expect(theme.preference()).toBe('dark');
    expect(localStorage.getItem('bookmonkey.theme')).toBe('dark');
  });

  it('ignores invalid selections without overwriting the saved choice', () => {
    localStorage.setItem('bookmonkey.theme', 'dark');
    const theme = TestBed.inject(ThemeService);
    theme.initialize();
    theme.setPreference('system');
    theme.setPreference('invalid');
    expect(theme.preference()).toBe('dark');
    expect(localStorage.getItem('bookmonkey.theme')).toBe('dark');
  });
});
