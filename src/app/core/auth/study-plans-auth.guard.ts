import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { StudyPlansAuthService } from './study-plans-auth.service';

export const studyPlansAuthGuard: CanActivateFn = async () => {
  const auth = inject(StudyPlansAuthService);
  const router = inject(Router);
  if (auth.user()) return true;
  try {
    const restored = await Promise.race([
      auth.restore(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000)),
    ]);
    if (restored) return true;
  } catch {
    return router.createUrlTree(['/login']);
  }
  return router.createUrlTree(['/login']);
};
