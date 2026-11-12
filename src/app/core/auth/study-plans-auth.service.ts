import { Injectable, computed, signal } from '@angular/core';

export interface StudyPlansUser {
  readonly id: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly applicationRoles: readonly string[];
  readonly scopes: readonly string[];
}

const authBaseUrl = '/api/v1/auth';

@Injectable({ providedIn: 'root' })
export class StudyPlansAuthService {
  readonly user = signal<StudyPlansUser | null>(null);
  readonly faculty = computed(() => this.user()?.applicationRoles.includes('study-plans.faculty') ?? false);
  private csrfToken: string | null = null;

  async login(username: string, password: string, recaptchaToken: string, totpCode?: string): Promise<string | null> {
    const response = await fetch(`${authBaseUrl}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, recaptchaToken, ...(totpCode ? { totpCode } : {}) }),
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    const payload = await response.json() as unknown;
    const enrollmentToken = enrollmentOf(payload);
    if (enrollmentToken) return enrollmentToken;
    const session = toSession(payload);
    this.csrfToken = session.csrfToken;
    this.user.set(session.user);
    return null;
  }

  async beginEnrollment(enrollmentToken: string): Promise<{ secret: string; qrSvg: string }> {
    const response = await fetch(`${authBaseUrl}/profile/totp/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentToken }),
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    const payload = await response.json() as { secret?: unknown; qrSvg?: unknown };
    if (typeof payload.secret !== 'string' || typeof payload.qrSvg !== 'string') throw new Error('No se pudo preparar la autenticación.');
    return { secret: payload.secret, qrSvg: payload.qrSvg };
  }

  async finishEnrollment(enrollmentToken: string, code: string): Promise<void> {
    const response = await fetch(`${authBaseUrl}/profile/totp/enroll/confirm`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentToken, code }),
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    const session = toSession(await response.json() as unknown);
    this.csrfToken = session.csrfToken;
    this.user.set(session.user);
  }

  async restore(): Promise<boolean> {
    const current = await this.session();
    if (current) {
      this.csrfToken = current.csrfToken;
      this.user.set(current.user);
      return true;
    }
    const refreshed = await fetch(`${authBaseUrl}/refresh`, { method: 'POST', credentials: 'include', signal: AbortSignal.timeout(4000) });
    if (!refreshed.ok || refreshed.status === 204) return false;
    const session = toSession(await refreshed.json() as unknown);
    this.csrfToken = session.csrfToken;
    this.user.set(session.user);
    return true;
  }

  csrfHeaders(): Readonly<Record<string, string>> {
    return this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {};
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${authBaseUrl}/logout`, { method: 'POST', credentials: 'include', headers: this.csrfHeaders() });
    } finally {
      this.csrfToken = null;
      this.user.set(null);
    }
  }

  private async session(): Promise<{ readonly csrfToken: string; readonly user: StudyPlansUser } | null> {
    const response = await fetch(`${authBaseUrl}/session`, { credentials: 'include', signal: AbortSignal.timeout(4000) });
    if (!response.ok || response.status === 204) return null;
    return toSession(await response.json() as unknown);
  }
}

const enrollmentOf = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const token = (value as { enrollmentToken?: unknown }).enrollmentToken;
  return (value as { enrollmentRequired?: unknown }).enrollmentRequired === true && typeof token === 'string' ? token : null;
};

const errorMessage = async (response: Response): Promise<string> => {
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === 'object' && typeof (payload as { message?: unknown }).message === 'string') {
      const message = (payload as { message: string }).message;
      return message;
    }
  } catch { /* cuerpo vacío */ }
  return 'No pudimos completar la solicitud.';
};

const toSession = (value: unknown): { readonly csrfToken: string; readonly user: StudyPlansUser } => {
  if (!value || typeof value !== 'object') throw new Error('Respuesta de autenticación inválida.');
  const record = value as Record<string, unknown>;
  const user = record['user'];
  if (!user || typeof user !== 'object') throw new Error('Respuesta de autenticación inválida.');
  const candidate = user as Record<string, unknown>;
  if (typeof candidate['id'] !== 'string' || typeof candidate['username'] !== 'string' || typeof record['csrfToken'] !== 'string') {
    throw new Error('Respuesta de autenticación inválida.');
  }
  const profile = candidate['profile'];
  const displayName = profile && typeof profile === 'object'
    && typeof (profile as Record<string, unknown>)['firstName'] === 'string'
    && typeof (profile as Record<string, unknown>)['paternalLastName'] === 'string'
    ? `${(profile as Record<string, string>)['firstName']} ${(profile as Record<string, string>)['paternalLastName']}`
    : null;
  return {
    csrfToken: record['csrfToken'],
    user: {
      id: candidate['id'],
      username: candidate['username'],
      displayName,
      applicationRoles: stringList(candidate['applicationRoles']),
      scopes: stringList(candidate['scopes']),
    },
  };
};

const stringList = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
