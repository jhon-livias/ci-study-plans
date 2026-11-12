import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { StudyPlansAuthService } from '../core/auth/study-plans-auth.service';
import { UiBrandComponent } from '../shared/ui/brand/ui-brand.component';
import { UiButtonComponent } from '../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, UiBrandComponent, UiButtonComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  readonly auth = inject(StudyPlansAuthService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
