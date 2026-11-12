import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';

import { PlansApi } from '../../core/api/plans-api';
import { StudyPlansAuthService } from '../../core/auth/study-plans-auth.service';

interface Named { readonly id: string; readonly code: string; readonly name: string; }
interface Career extends Named { readonly areaId: string; }
interface Catalog { readonly modalities: readonly Named[]; readonly areas: readonly Named[]; readonly careers: readonly Career[]; }
interface PlanRow { readonly id: string; readonly year: string; readonly status: 'ACTIVE' | 'INACTIVE'; }
interface CourseRow {
  readonly id: string; readonly position: number; readonly code: string; readonly name: string; readonly credits: number; readonly syllabus: 'PUBLISHED' | 'PENDING';
}
interface CycleRow { readonly id: string; readonly number: number; readonly courses: readonly CourseRow[]; }
interface Mesh {
  readonly id: string; readonly year: string; readonly status: 'ACTIVE' | 'INACTIVE';
  readonly career: Named; readonly modality: Named; readonly cycles: readonly CycleRow[];
}

@Component({ selector: 'app-plans', imports: [], templateUrl: './plans.page.html' })
export class PlansPage {
  private readonly api = inject(PlansApi);
  readonly auth = inject(StudyPlansAuthService);
  private readonly viewer = viewChild<ElementRef<HTMLElement>>('viewer');
  readonly catalog = signal<Catalog>({ modalities: [], areas: [], careers: [] });
  readonly modalityId = signal('');
  readonly areaId = signal('');
  readonly careerId = signal('');
  readonly plans = signal<readonly PlanRow[]>([]);
  readonly mesh = signal<Mesh | null>(null);
  readonly notice = signal('');
  readonly busy = signal(false);
  readonly year = signal(String(new Date().getFullYear()));
  readonly cycleNumber = signal('1');
  readonly course = signal({ id: '', cycleId: '', position: '1', code: '', name: '', credits: '3' });
  readonly courseOpen = signal(false);
  readonly pdfTitle = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const catalog = await this.api.get<Catalog>('/catalog');
      this.catalog.set(catalog);
      this.modalityId.set(catalog.modalities[0]?.id ?? '');
      this.areaId.set(catalog.areas[0]?.id ?? '');
      this.careerId.set(this.careers()[0]?.id ?? '');
      if (this.careerId()) await this.loadPlans();
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo abrir el catálogo.');
    }
  }

  careers(): readonly Career[] {
    return this.catalog().careers.filter((career) => career.areaId === this.areaId());
  }

  text(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement || target instanceof HTMLSelectElement ? target.value : '';
  }

  async chooseModality(event: Event): Promise<void> {
    this.modalityId.set(this.text(event));
    this.mesh.set(null);
    await this.loadPlans();
  }

  async chooseArea(event: Event): Promise<void> {
    this.areaId.set(this.text(event));
    this.careerId.set(this.careers()[0]?.id ?? '');
    this.mesh.set(null);
    await this.loadPlans();
  }

  async chooseCareer(event: Event): Promise<void> {
    this.careerId.set(this.text(event));
    this.mesh.set(null);
    await this.loadPlans();
  }

  async loadPlans(): Promise<void> {
    if (!this.careerId() || !this.modalityId()) { this.plans.set([]); return; }
    this.plans.set(await this.api.get<PlanRow[]>(`/curricula?careerId=${this.careerId()}&modalityId=${this.modalityId()}`));
  }

  async openPlan(id: string): Promise<void> {
    this.mesh.set(await this.api.get<Mesh>(`/curricula/${id}`));
  }

  async createPlan(): Promise<void> {
    if (!/^20\d{2}$/.test(this.year().trim())) { this.notice.set('La vigencia debe ser un año, por ejemplo 2024.'); return; }
    await this.run(async () => {
      await this.api.send('POST', '/curricula', { careerId: this.careerId(), modalityId: this.modalityId(), year: this.year().trim() });
      await this.loadPlans();
      this.notice.set('Plan creado. Actívalo cuando la malla esté lista.');
    });
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

  async removeCycle(cycle: CycleRow): Promise<void> {
    const mesh = this.mesh();
    if (!mesh || !confirm(`¿Eliminar el ciclo ${cycle.number}?`)) return;
    await this.run(async () => {
      await this.api.send('DELETE', `/cycles/${cycle.id}`);
      await this.openPlan(mesh.id);
    });
  }

  editCourse(cycleId: string, current?: CourseRow): void {
    this.course.set(current
      ? { id: current.id, cycleId, position: String(current.position), code: current.code, name: current.name, credits: String(current.credits) }
      : { id: '', cycleId, position: '1', code: '', name: '', credits: '3' });
    this.courseOpen.set(true);
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

  async removeCourse(course: CourseRow): Promise<void> {
    const mesh = this.mesh();
    if (!mesh || !confirm(`¿Eliminar ${course.code}?`)) return;
    await this.run(async () => {
      await this.api.send('DELETE', `/courses/${course.id}`);
      await this.openPlan(mesh.id);
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

  async removeSyllabus(course: CourseRow): Promise<void> {
    const mesh = this.mesh();
    if (!mesh || !confirm('¿Retirar el sílabo publicado?')) return;
    await this.run(async () => {
      await this.api.send('DELETE', `/courses/${course.id}/syllabus`);
      await this.openPlan(mesh.id);
    });
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
