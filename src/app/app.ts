import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AuthLayoutComponent],
  template: `
    @if (waiting()) {
      <app-auth-layout>
        <p class="text-sm text-[#5e5254]" role="status">Abriendo Planes de estudio…</p>
      </app-auth-layout>
    }
    <div [hidden]="waiting()">
      <router-outlet (activate)="waiting.set(false)" />
    </div>
  `,
})
export class App {
  readonly waiting = signal(true);
}
