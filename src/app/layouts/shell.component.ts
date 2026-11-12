import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { StudyPlansAuthService } from '../core/auth/study-plans-auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private readonly auth = inject(StudyPlansAuthService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly displayName = computed(() => this.auth.user()?.displayName || this.auth.user()?.username || 'Usuario');
  readonly roleLabel = computed(() => {
    if (this.auth.faculty()) return 'Facultad';
    if (this.auth.user()?.applicationRoles.includes('study-plans.teacher')) return 'Docente';
    return 'Planes de estudio';
  });

  toggleMenu(): void {
    this.menuOpen.update((value) => !value);
  }

  toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationsOpen.set(false);
    this.profileOpen.update((value) => !value);
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.profileOpen.set(false);
    this.notificationsOpen.update((value) => !value);
  }

  closePanels(): void {
    this.profileOpen.set(false);
    this.notificationsOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
