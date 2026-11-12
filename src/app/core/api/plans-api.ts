import { Injectable, inject } from '@angular/core';

import { StudyPlansAuthService } from '../auth/study-plans-auth.service';

@Injectable({ providedIn: 'root' })
export class PlansApi {
  private readonly auth = inject(StudyPlansAuthService);

  get<T>(path: string): Promise<T> { return this.send<T>('GET', path); }

  async send<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`/api/v1/study-plans${path}`, {
      method,
      credentials: 'include',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...this.auth.csrfHeaders() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 401) {
      await this.auth.logout();
      throw new Error('La sesión terminó. Vuelve a ingresar.');
    }
    if (!response.ok) throw new Error(await errorMessage(response));
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async pdf(courseId: string): Promise<Blob> {
    const response = await fetch(`/api/v1/study-plans/courses/${courseId}/syllabus`, { credentials: 'include' });
    if (!response.ok) throw new Error(await errorMessage(response));
    return response.blob();
  }
}

const errorMessage = async (response: Response): Promise<string> => {
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === 'object') {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
    }
  } catch { /* sin cuerpo */ }
  return 'No se pudo completar la operación.';
};
