import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';

import { PlansApi } from '../../core/api/plans-api';
import { StudyPlansAuthService } from '../../core/auth/study-plans-auth.service';
import { UiAlertComponent } from '../../shared/ui/alert/ui-alert.component';
import { UiBadgeComponent } from '../../shared/ui/badge/ui-badge.component';
import { UiButtonComponent } from '../../shared/ui/button/ui-button.component';
import { UiCardComponent } from '../../shared/ui/card/ui-card.component';
import { UiConfirmComponent } from '../../shared/ui/confirm/ui-confirm.component';
import { UiFieldComponent } from '../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent, type UiBreadcrumbItem } from '../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../shared/ui/select/ui-select.component';

interface Named { readonly id: string; readonly code: string; readonly name: string; }
interface Career extends Named { readonly areaId: string; }
interface Offering { readonly modalityId: string; readonly careerId: string; }
interface Catalog { readonly modalities: readonly Named[]; readonly areas: readonly Named[]; readonly careers: readonly Career[]; readonly offerings: readonly Offering[]; }
interface PlanRow { readonly id: string; readonly year: string; readonly status: 'ACTIVE' | 'INACTIVE'; }
interface CourseRow {
  readonly id: string; readonly position: number; readonly code: string; readonly name: string; readonly credits: number; readonly syllabus: 'PUBLISHED' | 'PENDING';
}
interface CycleRow { readonly id: string; readonly number: number; readonly courses: readonly CourseRow[]; }
interface Mesh {
  readonly id: string; readonly year: string; readonly status: 'ACTIVE' | 'INACTIVE';
  readonly career: Named; readonly modality: Named; readonly cycles: readonly CycleRow[];
}
interface PendingConfirm { readonly title: string; readonly message: string; readonly run: () => Promise<void>; }

@Component({
  selector: 'app-plans',
  imports: [UiAlertComponent, UiBadgeComponent, UiButtonComponent, UiCardComponent, UiConfirmComponent, UiFieldComponent, UiFilterBarComponent, UiPageHeaderComponent, UiSelectComponent],
  templateUrl: './plans.page.html',
})
export class PlansPage {
  private readonly api = inject(PlansApi);
  readonly auth = inject(StudyPlansAuthService);
  private readonly viewer = viewChild<ElementRef<HTMLElement>>('viewer');
  readonly catalog = signal<Catalog>({ modalities: [], areas: [], careers: [], offerings: [] });
  readonly modalityId = signal('');
  readonly areaId = signal('');
  readonly careerId = signal('');
  readonly plans = signal<readonly PlanRow[]>([]);
  readonly mesh = signal<Mesh | null>(null);
  readonly notice = signal('');
  readonly busy = signal(false);
  readonly year = signal('');
  readonly cycleNumber = signal('1');
  readonly course = signal({ id: '', cycleId: '', position: '1', code: '', name: '', credits: '3' });
  readonly courseOpen = signal(false);
  readonly pdfTitle = signal('');
  readonly pendingConfirm = signal<PendingConfirm | null>(null);
  readonly modalityOptions = computed((): readonly UiSelectOption[] => this.catalog().modalities.map((item) => ({ value: item.id, label: item.name })));
  readonly areaOptions = computed((): readonly UiSelectOption[] => {
    const areaIds = new Set(this.careersForModality().map((career) => career.areaId));
    return this.catalog().areas.filter((area) => areaIds.has(area.id)).map((item) => ({ value: item.id, label: item.name }));
  });
  readonly careerOptions = computed((): readonly UiSelectOption[] => this.careers().map((item) => ({ value: item.id, label: item.name })));
  readonly yearOptions = computed((): readonly UiSelectOption[] => [...this.plans()]
    .sort((left, right) => right.year.localeCompare(left.year))
    .map((plan) => ({ value: plan.year, label: plan.year })));
  readonly visiblePlans = computed(() => this.plans().filter((plan) => plan.year === this.year()));
  readonly crumbs = computed((): readonly UiBreadcrumbItem[] => this.mesh()
    ? [{ label: 'Planes', action: 'plans' }, { label: this.mesh()?.year ?? '' }]
    : [{ label: 'Planes de estudio' }]);

  async ngOnInit(): Promise<void> {
    try {
      const catalog = await this.api.get<Catalog>('/catalog');
      this.catalog.set(catalog);
      this.modalityId.set(catalog.modalities[0]?.id ?? '');
      this.keepValidSelection();
      if (this.careerId()) await this.loadPlans();
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo abrir el catálogo.');
    }
  }

  careersForModality(): readonly Career[] {
    const ids = new Set(this.catalog().offerings.filter((item) => item.modalityId === this.modalityId()).map((item) => item.careerId));
    return this.catalog().careers.filter((career) => ids.has(career.id));
  }

  careers(): readonly Career[] {
    return this.careersForModality().filter((career) => career.areaId === this.areaId());
  }

  private keepValidSelection(): void {
    const areas = this.areaOptions();
    if (!areas.some((area) => area.value === this.areaId())) this.areaId.set(areas[0]?.value ?? '');
    const careers = this.careers();
    if (!careers.some((career) => career.id === this.careerId())) this.careerId.set(careers[0]?.id ?? '');
  }

  async chooseModality(value: string): Promise<void> {
    this.modalityId.set(value);
    this.keepValidSelection();
    this.mesh.set(null);
    await this.loadPlans();
  }

  async chooseArea(value: string): Promise<void> {
    this.areaId.set(value);
    this.careerId.set(this.careers()[0]?.id ?? '');
    this.mesh.set(null);
    await this.loadPlans();
  }

  async chooseCareer(value: string): Promise<void> {
    this.careerId.set(value);
    this.mesh.set(null);
    await this.loadPlans();
  }

  onCrumb(action: string): void {
    if (action === 'plans') this.mesh.set(null);
  }

  async loadPlans(): Promise<void> {
    if (!this.careerId() || !this.modalityId()) { this.plans.set([]); this.year.set(''); return; }
    const rows = await this.api.get<PlanRow[]>(`/curricula?careerId=${this.careerId()}&modalityId=${this.modalityId()}`);
    this.plans.set(rows);
    const years = rows.map((plan) => plan.year);
    if (!years.includes(this.year())) this.year.set([...years].sort().at(-1) ?? '');
  }

  async openPlan(id: string): Promise<void> {
    this.mesh.set(await this.api.get<Mesh>(`/curricula/${id}`));
  }

  async setStatus(plan: PlanRow, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    await this.run(async () => {
      await this.api.send('POST', `/curricula/${plan.id}/${status === 'ACTIVE' ? 'activate' : 'deactivate'}`);
      await this.loadPlans();
      if (this.mesh()?.id === plan.id) await this.openPlan(plan.id);
    });
  }

  async addCycle(): Promise<void> {
    const mesh = this.mesh();
    const number = Number(this.cycleNumber());
    if (!mesh || !Number.isInteger(number)) return;
    await this.run(async () => {
      await this.api.send('POST', `/curricula/${mesh.id}/cycles`, { number });
      await this.openPlan(mesh.id);
    });
  }

  askRemoveCycle(cycle: CycleRow): void {
    const mesh = this.mesh();
    if (!mesh) return;
    this.pendingConfirm.set({
      title: 'Quitar ciclo',
      message: `¿Eliminar el ciclo ${cycle.number}?`,
      run: async () => {
        await this.api.send('DELETE', `/cycles/${cycle.id}`);
        await this.openPlan(mesh.id);
      },
    });
  }

  editCourse(cycleId: string, current?: CourseRow): void {
    this.course.set(current
      ? { id: current.id, cycleId, position: String(current.position), code: current.code, name: current.name, credits: String(current.credits) }
      : { id: '', cycleId, position: '1', code: '', name: '', credits: '3' });
    this.courseOpen.set(true);
  }

  patchCourse(key: 'position' | 'code' | 'name' | 'credits', value: string): void {
    const next = key === 'code' ? value.toUpperCase() : value;
    this.course.update((current) => ({ ...current, [key]: next }));
  }

  async saveCourse(): Promise<void> {
    const mesh = this.mesh();
    const draft = this.course();
    const credits = Number(draft.credits);
    if (!mesh || !/^[A-Z]{2}\d{3}$/.test(draft.code.trim()) || draft.name.trim().length < 3 || !Number.isFinite(credits)) {
      this.notice.set('Revisa código (EG101), nombre y créditos.');
      return;
    }
    const body = { position: Number(draft.position), code: draft.code.trim(), name: draft.name.trim(), credits };
    await this.run(async () => {
      if (draft.id) await this.api.send('PATCH', `/courses/${draft.id}`, body);
      else await this.api.send('POST', `/cycles/${draft.cycleId}/courses`, body);
      this.courseOpen.set(false);
      await this.openPlan(mesh.id);
    });
  }

  askRemoveCourse(course: CourseRow): void {
    const mesh = this.mesh();
    if (!mesh) return;
    this.pendingConfirm.set({
      title: 'Eliminar curso',
      message: `¿Eliminar ${course.code}?`,
      run: async () => {
        await this.api.send('DELETE', `/courses/${course.id}`);
        await this.openPlan(mesh.id);
      },
    });
  }

  async upload(course: CourseRow, event: Event): Promise<void> {
    const input = event.target;
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (input instanceof HTMLInputElement) input.value = '';
    const mesh = this.mesh();
    if (!file || !mesh) return;
    if (file.type !== 'application/pdf' || file.size > 8_000_000) { this.notice.set('El archivo debe ser un PDF de hasta 8 MB.'); return; }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50) { this.notice.set('El archivo no es un PDF.'); return; }
    await this.run(async () => {
      await this.api.send('POST', `/courses/${course.id}/syllabus`, { contentBase64: toBase64(bytes) });
      await this.openPlan(mesh.id);
    });
  }

  askRemoveSyllabus(course: CourseRow): void {
    const mesh = this.mesh();
    if (!mesh) return;
    this.pendingConfirm.set({
      title: 'Retirar sílabo',
      message: '¿Retirar el sílabo publicado?',
      run: async () => {
        await this.api.send('DELETE', `/courses/${course.id}/syllabus`);
        await this.openPlan(mesh.id);
      },
    });
  }

  async acceptConfirm(): Promise<void> {
    const current = this.pendingConfirm();
    this.pendingConfirm.set(null);
    if (!current) return;
    await this.run(current.run);
  }

  async viewSyllabus(course: CourseRow): Promise<void> {
    const blob = await this.api.pdf(course.id);
    const url = URL.createObjectURL(blob);
    const host = this.viewer()?.nativeElement;
    if (!host) return;
    host.replaceChildren();
    const frame = document.createElement('iframe');
    frame.title = `Sílabo ${course.code}`;
    frame.className = 'h-[70vh] w-full rounded-xl border border-[#ead7d8]';
    frame.src = url;
    host.append(frame);
    this.pdfTitle.set(`${course.code} · ${course.name}`);
  }

  async download(course: CourseRow): Promise<void> {
    const blob = await this.api.pdf(course.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `silabo-${course.code}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  closeViewer(): void {
    this.pdfTitle.set('');
    this.viewer()?.nativeElement.replaceChildren();
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.notice.set('');
    try { await action(); }
    catch (error) { this.notice.set(error instanceof Error ? error.message : 'No se pudo completar la operación.'); }
    finally { this.busy.set(false); }
  }
}

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};
