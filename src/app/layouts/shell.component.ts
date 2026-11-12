import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { StudyPlansAuthService } from '../core/auth/study-plans-auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly auth = inject(StudyPlansAuthService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
