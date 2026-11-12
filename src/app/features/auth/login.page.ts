import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';

import { StudyPlansAuthService } from '../../core/auth/study-plans-auth.service';
import { RecaptchaService } from '../../core/security/recaptcha.service';

@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly auth = inject(StudyPlansAuthService);
  private readonly recaptcha = inject(RecaptchaService);
  private readonly router = inject(Router);
  readonly credentials = signal({ username: '', password: '' });
  readonly loginForm = form(this.credentials, (path) => {
    required(path.username, { message: 'Ingresa tu usuario.' });
    required(path.password, { message: 'Ingresa tu contraseña.' });
    minLength(path.password, 8, { message: 'La contraseña debe tener al menos 8 caracteres.' });
  });
  readonly totpCode = signal('');
  readonly needsCode = signal(false);
  readonly enrollment = signal<{ token: string; secret: string; qr: string } | null>(null);
  readonly enrollCode = signal('');
  readonly submitting = signal(false);
  readonly notice = signal('');

  text(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.value : '';
  }

  async submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.loginForm().markAsTouched();
    if (this.loginForm().invalid()) { this.notice.set('Revisa los datos marcados.'); return; }
    this.submitting.set(true);
    this.notice.set('');
    try {
      const token = await this.auth.login(this.credentials().username.trim(), this.credentials().password, await this.recaptcha.executeLogin(), this.totpCode().trim() || undefined);
      if (token) {
        const setup = await this.auth.beginEnrollment(token);
        this.enrollment.set({ token, secret: setup.secret, qr: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qrSvg)}` });
        return;
      }
      await this.router.navigateByUrl('/');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'No pudimos iniciar sesión.';
      if (text.toLowerCase().includes('código')) this.needsCode.set(true);
      this.notice.set(text);
    } finally { this.submitting.set(false); }
  }

  async confirmEnrollment(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const current = this.enrollment();
    if (!current || !/^\d{6}$/.test(this.enrollCode().trim())) { this.notice.set('Ingresa el código de 6 dígitos.'); return; }
    this.submitting.set(true);
    try {
      await this.auth.finishEnrollment(current.token, this.enrollCode().trim());
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo activar la autenticación.');
    } finally { this.submitting.set(false); }
  }
}
