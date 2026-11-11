import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeSelectorComponent } from './shared/theme-selector.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThemeSelectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'BookMonkey';
}
