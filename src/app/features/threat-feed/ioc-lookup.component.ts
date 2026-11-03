import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Ioc, IocType } from '../../core/models/models';
import { DataService } from '../../core/services/data.service';
import { BadgeComponent } from '../../shared/components/severity-badge.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const HASH = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const DOMAIN = /^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,}$/i;

/** Detects whether the text is an IP, domain, URL or file hash. */
export function detectIocType(value: string): IocType | null {
  const v = value.trim();
  if (IPV4.test(v)) return 'ip';
  if (HASH.test(v)) return 'hash';
  if (URL_RE.test(v)) return 'url';
  if (DOMAIN.test(v)) return 'domain';
  return null;
}

const iocValidator: ValidatorFn = (c) => (!c.value || detectIocType(c.value) ? null : { invalidIoc: true });

interface LookupResult {
  query: string;
  type: IocType;
  ioc?: Ioc;
  riskScore: number;
  verdict: 'Malicious' | 'Suspicious' | 'Clean';
  known: boolean;
}

/** Member 2 – IOC lookup (IP / domain / URL / hash) with validation, risk gauge and history. */
@Component({
  selector: 'app-ioc-lookup',
  imports: [ReactiveFormsModule, BadgeComponent, TimeAgoPipe],
  templateUrl: './ioc-lookup.component.html'
})
export class IocLookupComponent {
  private data = inject(DataService);

  input = new FormControl('', { nonNullable: true, validators: [Validators.required, iocValidator] });
  result = signal<LookupResult | null>(null);
  history = signal<string[]>(this.loadHistory());
  scanning = signal(false);

  examples = ['185.220.101.45', 'secure-login-verify.com', '8.8.8.8'];

  circumference = 2 * Math.PI * 70;

  private typed = toSignal(this.input.valueChanges, { initialValue: '' });
  liveType = computed<IocType | null>(() => (this.typed() ? detectIocType(this.typed()) : null));

  useExample(v: string): void {
    this.input.setValue(v);
    this.search();
  }

  search(): void {
    this.input.markAsTouched();
    if (this.input.invalid) return;
    const query = this.input.value.trim();
    const type = detectIocType(query)!;
    this.scanning.set(true);
    this.result.set(null);
    // short delay to simulate querying threat-intelligence sources
    setTimeout(() => {
      const ioc = this.data.lookupIoc(query);
      const score = ioc ? ioc.riskScore : this.pseudoScore(query);
      this.result.set({
        query, type, ioc, known: !!ioc, riskScore: score,
        verdict: score >= 75 ? 'Malicious' : score >= 40 ? 'Suspicious' : 'Clean'
      });
      this.scanning.set(false);
      this.saveHistory(query);
    }, 700);
  }

  clearHistory(): void {
    this.history.set([]);
    try { localStorage.removeItem('tid-ioc-history'); } catch { /* ignore */ }
  }

  scoreColor(score: number): string {
    return score >= 75 ? 'var(--critical)' : score >= 40 ? 'var(--high)' : 'var(--ok)';
  }

  /** Deterministic score for values not present in the local database. */
  private pseudoScore(q: string): number {
    let h = 0;
    for (const ch of q) h = (h * 31 + ch.charCodeAt(0)) % 1000;
    return h % 45; // unknown indicators are treated as low risk
  }

  private loadHistory(): string[] {
    try { return JSON.parse(localStorage.getItem('tid-ioc-history') ?? '[]'); } catch { return []; }
  }

  private saveHistory(q: string): void {
    const list = [q, ...this.history().filter((x) => x !== q)].slice(0, 6);
    this.history.set(list);
    try { localStorage.setItem('tid-ioc-history', JSON.stringify(list)); } catch { /* ignore */ }
  }
}
