import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { SEVERITIES, Threat } from '../../core/models/models';
import { DataService } from '../../core/services/data.service';
import { ToastService } from '../../core/services/toast.service';
import { BadgeComponent } from '../../shared/components/severity-badge.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

type SortKey = 'timestamp' | 'severity' | 'name' | 'country' | 'confidence';

/** Member 2 – Threat feed: live search (RxJS debounce), filters, sorting and pagination. */
@Component({
  selector: 'app-threat-feed',
  imports: [ReactiveFormsModule, BadgeComponent, TimeAgoPipe],
  templateUrl: './threat-feed.component.html'
})
export class ThreatFeedComponent {
  private data = inject(DataService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // Query params (?q=…&severity=…) are bound automatically by the router.
  q = input<string>();
  severity = input<string>();

  threats = toSignal(this.data.threats, { initialValue: [] });
  searchCtl = new FormControl('', { nonNullable: true });
  search = toSignal(this.searchCtl.valueChanges.pipe(startWith(''), debounceTime(250), distinctUntilChanged()), { initialValue: '' });

  sevFilter = signal('All');
  typeFilter = signal('All');
  statusFilter = signal('All');
  sortKey = signal<SortKey>('timestamp');
  sortDir = signal<'asc' | 'desc'>('desc');
  page = signal(1);
  pageSize = 10;

  readonly severities = ['All', ...SEVERITIES];
  readonly statuses = ['All', 'Active', 'Investigating', 'Mitigated'];
  types = computed(() => ['All', ...new Set(this.threats().map((t) => t.type))].sort((a, b) => (a === 'All' ? -1 : a.localeCompare(b))));
  private sevRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

  constructor() {
    effect(() => {
      const q = this.q();
      if (q !== undefined) this.searchCtl.setValue(q);
    });
    effect(() => {
      const s = this.severity();
      if (s && SEVERITIES.includes(s as never)) this.sevFilter.set(s);
    });
    // reset to first page whenever filters change
    effect(() => {
      this.search(); this.sevFilter(); this.typeFilter(); this.statusFilter();
      this.page.set(1);
    });
  }

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const sev = this.sevFilter(), type = this.typeFilter(), status = this.statusFilter();
    const key = this.sortKey(), dir = this.sortDir() === 'asc' ? 1 : -1;
    return this.threats()
      .filter((t) => (sev === 'All' || t.severity === sev) && (type === 'All' || t.type === type) && (status === 'All' || t.status === status))
      .filter((t) => !q || [t.id, t.name, t.type, t.sourceIp, t.country, t.targetAsset].some((f) => f.toLowerCase().includes(q)))
      .sort((a, b) => {
        let r = 0;
        if (key === 'timestamp') r = a.timestamp.getTime() - b.timestamp.getTime();
        else if (key === 'severity') r = this.sevRank[a.severity] - this.sevRank[b.severity];
        else if (key === 'confidence') r = a.confidence - b.confidence;
        else r = a[key].localeCompare(b[key]);
        return r * dir;
      });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  rows = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));
  hasFilters = computed(() => this.sevFilter() !== 'All' || this.typeFilter() !== 'All' || this.statusFilter() !== 'All' || !!this.search());

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    else { this.sortKey.set(key); this.sortDir.set(key === 'name' || key === 'country' ? 'asc' : 'desc'); }
  }

  arrow(key: SortKey): string {
    return this.sortKey() === key ? (this.sortDir() === 'asc' ? '▲' : '▼') : '';
  }

  clear(): void {
    this.searchCtl.setValue('');
    this.sevFilter.set('All'); this.typeFilter.set('All'); this.statusFilter.set('All');
    this.router.navigate([], { queryParams: {} });
  }

  open(t: Threat): void {
    this.router.navigate(['/threats', t.id]);
  }

  block(t: Threat, ev: Event): void {
    ev.stopPropagation();
    this.data.blockIp(t.id);
    this.toast.show(`${t.sourceIp} blocked at the firewall.`, 'success');
  }
}
