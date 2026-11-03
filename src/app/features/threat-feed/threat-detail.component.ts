import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ThreatStatus } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { ToastService } from '../../core/services/toast.service';
import { BadgeComponent } from '../../shared/components/severity-badge.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

/** Member 2 – Detail page for one threat. The `id` comes from the route (/threats/:id). */
@Component({
  selector: 'app-threat-detail',
  imports: [RouterLink, BadgeComponent, TimeAgoPipe],
  templateUrl: './threat-detail.component.html'
})
export class ThreatDetailComponent {
  private data = inject(DataService);
  private router = inject(Router);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  id = input.required<string>();
  private all = toSignal(this.data.threats, { initialValue: [] });
  threat = computed(() => this.all().find((t) => t.id === this.id()));
  related = computed(() => {
    const t = this.threat();
    if (!t) return [];
    return this.all().filter((x) => x.id !== t.id && (x.sourceIp === t.sourceIp || x.type === t.type)).slice(0, 4);
  });
  canAct = computed(() => this.auth.hasRole('admin', 'analyst'));
  statuses: ThreatStatus[] = ['Active', 'Investigating', 'Mitigated'];

  setStatus(s: ThreatStatus): void {
    const t = this.threat();
    if (!t) return;
    this.data.updateThreatStatus(t.id, s);
    this.toast.show(`Status updated to ${s}.`, 'success');
  }

  block(): void {
    const t = this.threat();
    if (!t) return;
    this.data.blockIp(t.id);
    this.toast.show(`${t.sourceIp} blocked at the firewall.`, 'success');
  }

  createIncident(): void {
    const t = this.threat();
    if (!t) return;
    this.router.navigate(['/incidents'], { queryParams: { newFrom: t.id } });
  }
}
