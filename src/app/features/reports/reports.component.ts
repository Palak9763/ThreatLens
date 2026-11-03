import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChartConfiguration } from 'chart.js';
import { INCIDENT_STATUSES, SEVERITIES } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { ToastService } from '../../core/services/toast.service';
import { ChartComponent } from '../../shared/components/chart.component';
import { downloadFile, toCsv } from '../../shared/utils/csv';

/** Member 4 – Reports: summary statistics, CSV export and print-to-PDF. */
@Component({
  selector: 'app-reports',
  imports: [ChartComponent],
  templateUrl: './reports.component.html'
})
export class ReportsComponent {
  private data = inject(DataService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  threats = toSignal(this.data.threats, { initialValue: [] });
  incidents = toSignal(this.data.incidents, { initialValue: [] });
  iocs = toSignal(this.data.iocs, { initialValue: [] });

  period = signal(30);
  readonly periods = [7, 14, 30];
  generatedAt = new Date();

  scoped = computed(() => {
    const since = Date.now() - this.period() * 86_400_000;
    return this.threats().filter((t) => t.timestamp.getTime() >= since);
  });

  summary = computed(() => {
    const t = this.scoped();
    const inc = this.incidents();
    const resolved = inc.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;
    return {
      total: t.length,
      critical: t.filter((x) => x.severity === 'Critical').length,
      mitigated: t.filter((x) => x.status === 'Mitigated').length,
      incidents: inc.length,
      resolutionRate: inc.length ? Math.round((resolved / inc.length) * 100) : 0,
      maliciousIocs: this.iocs().filter((i) => i.verdict === 'Malicious').length
    };
  });

  bySeverity = computed(() => SEVERITIES.map((s) => ({ name: s, count: this.scoped().filter((t) => t.severity === s).length })));
  byType = computed(() => {
    const map = new Map<string, number>();
    this.scoped().forEach((t) => map.set(t.type, (map.get(t.type) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  });
  byStatus = computed(() => INCIDENT_STATUSES.map((s) => ({ name: s, count: this.incidents().filter((i) => i.status === s).length })));
  topAssets = computed(() => {
    const map = new Map<string, number>();
    this.scoped().forEach((t) => map.set(t.targetAsset, (map.get(t.targetAsset) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  });

  severityChart = computed<ChartConfiguration>(() => ({
    type: 'bar',
    data: {
      labels: this.bySeverity().map((s) => s.name),
      datasets: [{ label: 'Threats', data: this.bySeverity().map((s) => s.count), backgroundColor: ['#ff4d6d', '#ff9f43', '#facc15', '#34d399'], borderRadius: 8, maxBarThickness: 60 }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
  }));

  incidentChart = computed<ChartConfiguration>(() => ({
    type: 'doughnut',
    data: {
      labels: this.byStatus().map((s) => s.name),
      datasets: [{ data: this.byStatus().map((s) => s.count), backgroundColor: ['#ff4d6d', '#ff9f43', '#34d399', '#6b7a99'], borderWidth: 0 }]
    },
    options: { cutout: '62%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 10 } } } }
  }));

  exportThreats(): void {
    const rows = this.scoped().map((t) => ({
      ID: t.id, Name: t.name, Type: t.type, Severity: t.severity, Status: t.status,
      SourceIP: t.sourceIp, Country: t.country, TargetAsset: t.targetAsset, Confidence: t.confidence, Detected: t.timestamp.toISOString()
    }));
    this.save('threats-report.csv', rows, 'Threat report');
  }

  exportIncidents(): void {
    const rows = this.incidents().map((i) => ({
      ID: i.id, Title: i.title, Severity: i.severity, Status: i.status, Assignee: i.assignee, Created: i.createdAt.toISOString()
    }));
    this.save('incidents-report.csv', rows, 'Incident report');
  }

  exportIocs(): void {
    const rows = this.iocs().map((i) => ({ ID: i.id, Type: i.type, Indicator: i.value, RiskScore: i.riskScore, Verdict: i.verdict, Reports: i.reports, Country: i.country }));
    this.save('ioc-report.csv', rows, 'IOC report');
  }

  print(): void {
    this.generatedAt = new Date();
    setTimeout(() => window.print(), 50);
  }

  private save(name: string, rows: Record<string, unknown>[], label: string): void {
    if (!rows.length) {
      this.toast.show('There is no data to export.', 'error');
      return;
    }
    downloadFile(name, toCsv(rows));
    this.toast.show(`${label} downloaded (${rows.length} rows).`, 'success');
  }
}
