import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { StudyPlansAuthService } from './study-plans-auth.service';

export const studyPlansAuthGuard: CanActivateFn = async () => {
  const auth = inject(StudyPlansAuthService);
  const router = inject(Router);
  if (auth.user()) return true;
  try {
    if (await auth.restore()) return true;
  } catch {
    return router.createUrlTree(['/login']);
  }
  return router.createUrlTree(['/login']);
};
