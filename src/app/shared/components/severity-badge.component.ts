import { Component, input } from '@angular/core';

/** Coloured pill for severity / status labels. */
@Component({
  selector: 'app-badge',
  template: `<span class="badge" [class]="'badge b-' + cls()"><span class="dot"></span>{{ label() }}</span>`
})
export class BadgeComponent {
  label = input.required<string>();
  cls() {
    return this.label().toLowerCase().replace(/\s+/g, '-');
  }
}
