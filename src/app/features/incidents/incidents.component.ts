import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { INCIDENT_STATUSES, Incident, IncidentStatus, SEVERITIES, Severity } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { ToastService } from '../../core/services/toast.service';
import { BadgeComponent } from '../../shared/components/severity-badge.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

/** Member 3 – Incident response: kanban board (drag & drop), list view, create/edit form, notes. */
@Component({
  selector: 'app-incidents',
  imports: [ReactiveFormsModule, BadgeComponent, TimeAgoPipe],
  templateUrl: './incidents.component.html'
})
export class IncidentsComponent {
  private data = inject(DataService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private router = inject(Router);
  auth = inject(AuthService);

  /** ?newFrom=THR-1001 pre-fills the form from a threat. */
  newFrom = input<string>();

  incidents = toSignal(this.data.incidents, { initialValue: [] });
  threats = toSignal(this.data.threats, { initialValue: [] });

  readonly statuses = INCIDENT_STATUSES;
  readonly severities = SEVERITIES;
  readonly analysts = ['Aarav Sharma', 'Priya Nair', 'Rohan Patil', 'Sneha Kulkarni'];

  view = signal<'board' | 'list'>('board');
  search = signal('');
  sevFilter = signal('All');
  mineOnly = signal(false);

  showForm = signal(false);
  editingId = signal<string | null>(null);
  selectedId = signal<string | null>(null);
  dragId = signal<string | null>(null);
  overCol = signal<IncidentStatus | null>(null);
  confirmDelete = signal(false);

  canEdit = computed(() => this.auth.hasRole('admin', 'analyst'));
  selected = computed(() => this.incidents().find((i) => i.id === this.selectedId()) ?? null);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(90)]],
    severity: ['Medium' as Severity, Validators.required],
    assignee: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]]
  });
  noteCtl = this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const sev = this.sevFilter();
    const me = this.auth.currentUser()?.name;
    return this.incidents().filter(
      (i) =>
        (sev === 'All' || i.severity === sev) &&
        (!this.mineOnly() || i.assignee === me) &&
        (!q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.assignee.toLowerCase().includes(q))
    );
  });

  columns = computed(() =>
    this.statuses.map((s) => ({
      status: s,
      items: this.filtered().filter((i) => i.status === s).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }))
  );

  constructor() {
    effect(() => {
      const from = this.newFrom();
      const list = this.threats();
      if (!from || !list.length) return;
      const t = list.find((x) => x.id === from);
      if (!t) return;
      this.openCreate();
      this.form.patchValue({
        title: `${t.name} on ${t.targetAsset}`,
        severity: t.severity,
        description: `Raised from ${t.id}. ${t.type} from ${t.sourceIp} (${t.country}) targeting ${t.targetAsset}.`
      });
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    });
  }

  // ---- create / edit ----
  openCreate(): void {
    if (!this.canEdit()) return;
    this.editingId.set(null);
    this.form.reset({ title: '', severity: 'Medium', assignee: this.auth.currentUser()?.name ?? this.analysts[0], description: '' });
    this.showForm.set(true);
  }

  openEdit(i: Incident): void {
    this.editingId.set(i.id);
    this.form.reset({ title: i.title, severity: i.severity, assignee: i.assignee, description: i.description });
    this.selectedId.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const author = this.auth.currentUser()?.name ?? 'Unknown';
    const id = this.editingId();
    if (id) {
      this.data.updateIncident(id, value);
      this.toast.show(`${id} updated.`, 'success');
    } else {
      const created = this.data.createIncident(value, author);
      this.toast.show(`${created.id} created.`, 'success');
    }
    this.showForm.set(false);
  }

  // ---- status / drag & drop ----
  move(i: Incident, status: IncidentStatus): void {
    if (!this.canEdit()) return;
    this.data.moveIncident(i.id, status, this.auth.currentUser()?.name ?? 'Unknown');
    this.toast.show(`${i.id} moved to ${status}.`, 'info');
  }

  onDragStart(ev: DragEvent, i: Incident): void {
    if (!this.canEdit()) { ev.preventDefault(); return; }
    this.dragId.set(i.id);
    ev.dataTransfer?.setData('text/plain', i.id);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(ev: DragEvent, col: IncidentStatus): void {
    ev.preventDefault();
    this.overCol.set(col);
  }

  onDrop(ev: DragEvent, col: IncidentStatus): void {
    ev.preventDefault();
    const id = this.dragId() ?? ev.dataTransfer?.getData('text/plain');
    const inc = this.incidents().find((x) => x.id === id);
    if (inc) this.move(inc, col);
    this.dragId.set(null);
    this.overCol.set(null);
  }

  onDragEnd(): void {
    this.dragId.set(null);
    this.overCol.set(null);
  }

  // ---- detail / notes ----
  open(i: Incident): void {
    this.selectedId.set(i.id);
    this.noteCtl.reset('');
    this.confirmDelete.set(false);
  }

  addNote(): void {
    const sel = this.selected();
    if (!sel || this.noteCtl.invalid) { this.noteCtl.markAsTouched(); return; }
    this.data.addNote(sel.id, this.noteCtl.value.trim(), this.auth.currentUser()?.name ?? 'Unknown');
    this.noteCtl.reset('');
  }

  assign(i: Incident, name: string): void {
    this.data.updateIncident(i.id, { assignee: name });
    this.toast.show(`${i.id} assigned to ${name}.`, 'success');
  }

  remove(): void {
    const sel = this.selected();
    if (!sel) return;
    if (!this.confirmDelete()) { this.confirmDelete.set(true); return; }
    this.data.deleteIncident(sel.id);
    this.selectedId.set(null);
    this.toast.show(`${sel.id} deleted.`, 'success');
  }

  nextStatus(i: Incident): IncidentStatus | null {
    const idx = this.statuses.indexOf(i.status);
    return idx < this.statuses.length - 1 ? this.statuses[idx + 1] : null;
  }

  resetDemo(): void {
    this.data.resetDemoData();
    this.toast.show('Demo incidents restored.', 'info');
  }
}
