import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, forkJoin, interval, map, of } from 'rxjs';
import { Incident, IncidentNote, IncidentStatus, Ioc, Severity, Threat, ThreatStatus, User } from '../models/models';
import { ToastService } from './toast.service';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
const STORE_KEY = 'tid-incidents-v1';

/**
 * Central data layer. The "database" is a set of JSON files in /public/data.
 * State is held in BehaviorSubjects (RxJS); incidents are persisted in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private threats$ = new BehaviorSubject<Threat[]>([]);
  private iocs$ = new BehaviorSubject<Ioc[]>([]);
  private incidents$ = new BehaviorSubject<Incident[]>([]);
  private users$ = new BehaviorSubject<User[]>([]);
  private loaded$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);
  private liveSub?: Subscription;
  private threatCounter = 2000;

  readonly threats: Observable<Threat[]> = this.threats$.asObservable();
  readonly iocs: Observable<Ioc[]> = this.iocs$.asObservable();
  readonly incidents: Observable<Incident[]> = this.incidents$.asObservable();
  readonly users: Observable<User[]> = this.users$.asObservable();
  readonly loaded: Observable<boolean> = this.loaded$.asObservable();
  readonly error: Observable<string | null> = this.error$.asObservable();
  readonly liveOn$ = new BehaviorSubject<boolean>(false);

  /** Load all JSON files once (called from the app shell). */
  load(): void {
    if (this.loaded$.value) return;
    forkJoin({
      threats: this.http.get<any[]>('data/threats.json'),
      iocs: this.http.get<any[]>('data/iocs.json'),
      incidents: this.http.get<any[]>('data/incidents.json'),
      users: this.http.get<User[]>('data/users.json')
    })
      .pipe(
        catchError((err) => {
          this.error$.next('Could not load data files. Please refresh the page.');
          console.error(err);
          return of(null);
        })
      )
      .subscribe((res) => {
        if (!res) return;
        this.threats$.next(res.threats.map((t) => ({ ...t, timestamp: minutesAgo(t.minutesAgo) })));
        this.iocs$.next(
          res.iocs.map((i) => ({ ...i, firstSeen: minutesAgo(i.firstSeenMinutesAgo), lastSeen: minutesAgo(i.lastSeenMinutesAgo) }))
        );
        this.incidents$.next(this.restoreIncidents(res.incidents));
        this.users$.next(res.users);
        this.loaded$.next(true);
      });
  }

  // ---------- Threats ----------
  getThreat(id: string): Observable<Threat | undefined> {
    return this.threats.pipe(map((list) => list.find((t) => t.id === id)));
  }

  updateThreatStatus(id: string, status: ThreatStatus): void {
    this.threats$.next(this.threats$.value.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  blockIp(id: string): void {
    this.threats$.next(this.threats$.value.map((t) => (t.id === id ? { ...t, blocked: true, status: 'Mitigated' } : t)));
  }

  /** Simulated live feed: a new threat arrives every few seconds. */
  setLive(on: boolean): void {
    this.liveOn$.next(on);
    this.liveSub?.unsubscribe();
    if (!on) return;
    this.liveSub = interval(6000).subscribe(() => this.pushRandomThreat());
  }

  private pushRandomThreat(): void {
    const pool = this.threats$.value;
    if (!pool.length) return;
    const base = pool[Math.floor(Math.random() * pool.length)];
    const sev: Severity[] = ['Critical', 'High', 'High', 'Medium', 'Medium', 'Low'];
    const severity = sev[Math.floor(Math.random() * sev.length)];
    const fresh: Threat = {
      ...base,
      id: `THR-${++this.threatCounter}`,
      severity,
      status: 'Active',
      blocked: false,
      timestamp: new Date(),
      sourceIp: `${45 + Math.floor(Math.random() * 150)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`
    };
    this.threats$.next([fresh, ...this.threats$.value]);
    this.toast.show(`${severity} – ${fresh.name} from ${fresh.country}`, severity === 'Critical' ? 'danger' : 'info', 4000);
  }

  // ---------- IOCs ----------
  lookupIoc(query: string): Ioc | undefined {
    const q = query.trim().toLowerCase();
    return this.iocs$.value.find((i) => i.value.toLowerCase() === q);
  }

  // ---------- Incidents ----------
  getIncident(id: string): Incident | undefined {
    return this.incidents$.value.find((i) => i.id === id);
  }

  createIncident(data: Pick<Incident, 'title' | 'severity' | 'assignee' | 'description'>, author: string): Incident {
    const nextNum = Math.max(300, ...this.incidents$.value.map((i) => Number(i.id.split('-')[1]))) + 1;
    const incident: Incident = {
      ...data,
      id: `INC-${nextNum}`,
      status: 'Open',
      createdAt: new Date(),
      notes: [{ author, text: 'Incident created.', timestamp: new Date() }]
    };
    this.setIncidents([incident, ...this.incidents$.value]);
    return incident;
  }

  updateIncident(id: string, patch: Partial<Incident>): void {
    this.setIncidents(this.incidents$.value.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  moveIncident(id: string, status: IncidentStatus, author: string): void {
    const inc = this.getIncident(id);
    if (!inc || inc.status === status) return;
    const note: IncidentNote = { author, text: `Status changed: ${inc.status} → ${status}`, timestamp: new Date() };
    this.updateIncident(id, { status, notes: [...inc.notes, note] });
  }

  addNote(id: string, text: string, author: string): void {
    const inc = this.getIncident(id);
    if (!inc) return;
    this.updateIncident(id, { notes: [...inc.notes, { author, text, timestamp: new Date() }] });
  }

  deleteIncident(id: string): void {
    this.setIncidents(this.incidents$.value.filter((i) => i.id !== id));
  }

  resetDemoData(): void {
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    this.http.get<any[]>('data/incidents.json').subscribe((raw) => this.incidents$.next(this.revive(raw)));
  }

  // ---------- persistence helpers ----------
  private setIncidents(list: Incident[]): void {
    this.incidents$.next(list);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch { /* storage may be unavailable */ }
  }

  private restoreIncidents(raw: any[]): Incident[] {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) return this.reviveSaved(JSON.parse(saved));
    } catch { /* fall back to seed data */ }
    return this.revive(raw);
  }

  private revive(raw: any[]): Incident[] {
    return raw.map((i) => ({
      ...i,
      createdAt: minutesAgo(i.createdMinutesAgo),
      notes: i.notes.map((n: any) => ({ ...n, timestamp: minutesAgo(n.minutesAgo) }))
    }));
  }

  private reviveSaved(raw: any[]): Incident[] {
    return raw.map((i) => ({
      ...i,
      createdAt: new Date(i.createdAt),
      notes: i.notes.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }))
    }));
  }

  /** Current values (used by the Reports page for exports). */
  snapshot() {
    return { threats: this.threats$.value, incidents: this.incidents$.value, iocs: this.iocs$.value };
  }
}
