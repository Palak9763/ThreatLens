import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-wrap" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast t-' + t.kind" (click)="toast.dismiss(t.id)">
          <span class="t-ico">{{ icon(t.kind) }}</span>
          <span>{{ t.message }}</span>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  toast = inject(ToastService);
  icon(kind: string) {
    return { success: '✔', error: '✖', danger: '⚠', info: 'ℹ' }[kind] ?? 'ℹ';
  }
}
