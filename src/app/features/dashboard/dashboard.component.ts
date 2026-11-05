import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { SEVERITIES, Severity } from '../../core/models/models';
import { DataService } from '../../core/services/data.service';
import { BadgeComponent } from '../../shared/components/severity-badge.component';
import { ChartComponent } from '../../shared/components/chart.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

export const SEV_COLORS: Record<Severity, string> = {
  Critical: '#ff4d6d',
  High: '#ff9f43',
  Medium: '#facc15',
  Low: '#34d399'
};
const PALETTE = ['#22d3ee', '#6366f1', '#ff4d6d', '#ff9f43', '#34d399', '#a78bfa', '#f472b6', '#facc15'];

/** Member 1 – Security overview dashboard (KPIs, charts, live alert feed). */
@Component({
  selector: 'app-dashboard',
  imports: [ChartComponent, BadgeComponent, TimeAgoPipe, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnDestroy {
  private data = inject(DataService);
  private router = inject(Router);

  ngOnDestroy(): void {
    this.data.setLive(false);
  }

  threats = toSignal(this.data.threats, { initialValue: [] });
  incidents = toSignal(this.data.incidents, { initialValue: [] });
  live = toSignal(this.data.liveOn$, { initialValue: false });

  rangeDays = signal(14);
  readonly ranges = [7, 14];
  readonly severities = SEVERITIES;

  inRange = computed(() => {
    const since = Date.now() - this.rangeDays() * 86_400_000;
    return this.threats().filter((t) => t.timestamp.getTime() >= since);
  });

  kpis = computed(() => {
    const list = this.inRange();
    return {
      total: list.length,
      critical: list.filter((t) => t.severity === 'Critical' && t.status !== 'Mitigated').length,
      openIncidents: this.incidents().filter((i) => i.status === 'Open' || i.status === 'Investigating').length,
      mitigated: list.filter((t) => t.status === 'Mitigated').length,
      mitigationRate: list.length ? Math.round((list.filter((t) => t.status === 'Mitigated').length / list.length) * 100) : 0
    };
  });

  recent = computed(() => [...this.threats()].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 7));

  severityCounts = computed(() =>
    SEVERITIES.map((s) => ({ name: s, count: this.inRange().filter((t) => t.severity === s).length }))
  );

  topCountries = computed(() => {
    const map = new Map<string, number>();
    this.inRange().forEach((t) => map.set(t.country, (map.get(t.country) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  });

  trendChart = computed<ChartConfiguration>(() => {
    const days = this.rangeDays();
    const labels: string[] = [];
    const total: number[] = [];
    const critical: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);
      const end = start.getTime() + 86_400_000;
      const day = this.threats().filter((t) => t.timestamp.getTime() >= start.getTime() && t.timestamp.getTime() < end);
      labels.push(start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
      total.push(day.length);
      critical.push(day.filter((t) => t.severity === 'Critical' || t.severity === 'High').length);
    }
    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'All threats', data: total, borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,.15)', fill: true, tension: 0.4, pointRadius: 3 },
          { label: 'Critical + High', data: critical, borderColor: '#ff4d6d', backgroundColor: 'rgba(255,77,109,.1)', fill: true, tension: 0.4, pointRadius: 3 }
        ]
      },
      options: { interaction: { mode: 'index', intersect: false }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }, plugins: { legend: { position: 'bottom' } } }
    };
  });

  typeChart = computed<ChartConfiguration>(() => {
    const map = new Map<string, number>();
    this.inRange().forEach((t) => map.set(t.type, (map.get(t.type) ?? 0) + 1));
    const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
    return {
      type: 'doughnut',
      data: { labels: entries.map((e) => e[0]), datasets: [{ data: entries.map((e) => e[1]), backgroundColor: PALETTE, borderWidth: 0, hoverOffset: 8 }] },
      options: { cutout: '65%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, usePointStyle: true } } } }
    };
  });

  countryChart = computed<ChartConfiguration>(() => ({
    type: 'bar',
    data: {
      labels: this.topCountries().map((c) => c[0]),
      datasets: [{ label: 'Attacks', data: this.topCountries().map((c) => c[1]), backgroundColor: '#6366f1', borderRadius: 6, maxBarThickness: 34 }]
    },
    options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { grid: { display: false } } } }
  }));

  maxCountry = computed(() => Math.max(1, ...this.topCountries().map((c) => c[1])));

  sevColor(s: Severity): string {
    return SEV_COLORS[s];
  }

  toggleLive(): void {
    this.data.setLive(!this.live());
  }

  go(path: string, params?: Record<string, string>): void {
    this.router.navigate([path], { queryParams: params });
  }

  openThreat(id: string): void {
    this.router.navigate(['/threats', id]);
  }
}
