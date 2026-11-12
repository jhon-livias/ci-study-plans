import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

interface RecaptchaApi { ready(callback: () => void): void; execute(siteKey: string, options: { readonly action: string }): Promise<string>; }
interface TrustedScriptPolicy { createScriptURL(value: string): string; }
declare global { interface Window { readonly __runtimeConfig?: { readonly recaptchaEnabled?: unknown; readonly recaptchaSiteKey?: unknown }; readonly grecaptcha?: RecaptchaApi; readonly trustedTypes?: { readonly defaultPolicy: TrustedScriptPolicy | null; createPolicy(name: string, rules: { readonly createScriptURL: (value: string) => string }): TrustedScriptPolicy; }; } }

@Injectable({ providedIn: 'root' })
export class RecaptchaService {
  private readonly document = inject(DOCUMENT);
  private loading: Promise<RecaptchaApi> | null = null;
  private policy: TrustedScriptPolicy | null = null;

  async executeLogin(): Promise<string> {
    const windowRef = this.document.defaultView;
    const siteKey = windowRef?.__runtimeConfig?.recaptchaSiteKey;
    if (windowRef?.__runtimeConfig?.recaptchaEnabled !== 'true' || typeof siteKey !== 'string' || siteKey.length < 8) {
      return 'recaptcha-disabled-in-nonproduction';
    }
    const api = await this.load(siteKey);
    return new Promise((resolve, reject) => api.ready(() => void api.execute(siteKey, { action: 'login' }).then(resolve, reject)));
  }

  private load(siteKey: string): Promise<RecaptchaApi> {
    const windowRef = this.document.defaultView;
    if (!windowRef) return Promise.reject(new Error('El navegador no está disponible.'));
    if (windowRef.grecaptcha) return Promise.resolve(windowRef.grecaptcha);
    this.loading ??= new Promise<RecaptchaApi>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.async = true;
      const url = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      this.policy ??= windowRef.trustedTypes?.createPolicy('recaptcha', { createScriptURL: (value) => value.startsWith('https://www.google.com/recaptcha/') ? value : '' }) ?? null;
      script.src = this.policy ? this.policy.createScriptURL(url) : url;
      script.onload = () => windowRef.grecaptcha ? resolve(windowRef.grecaptcha) : reject(new Error('No se cargó reCAPTCHA.'));
      script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA.'));
      this.document.head.append(script);
    });
    return this.loading;
  }
}
