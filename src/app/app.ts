import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ThemeService } from './core/services/theme.service';
import { inject } from '@angular/core';

@Component({
  imports: [RouterOutlet, ToastContainerComponent],
  selector: 'app-root',
  template: `<router-outlet /><app-toast-container />`
})
export class App {
  // Injecting ThemeService applies the saved theme as soon as the app starts.
  private theme = inject(ThemeService);
}
