import { TestBed } from '@angular/core/testing';

import { UiStepperComponent } from './ui-stepper.component';

describe('UiStepperComponent', () => {
  it('marks the active step and emits a different step', () => {
    const fixture = TestBed.createComponent(UiStepperComponent);
    const chosen: number[] = [];
    fixture.componentInstance.stepChange.subscribe((index) => chosen.push(index));
    fixture.componentRef.setInput('steps', [{ label: 'Editar Datos' }, { label: 'Editar Permisos' }]);
    fixture.componentRef.setInput('active', 0);
    fixture.detectChanges();

    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons[0]?.getAttribute('aria-current')).toBe('step');
    buttons[0]?.click();
    buttons[1]?.click();
    fixture.detectChanges();

    expect(chosen).toEqual([1]);
    expect(fixture.nativeElement.textContent).toContain('Editar Permisos');
  });
});
