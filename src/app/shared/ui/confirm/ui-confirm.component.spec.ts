import { TestBed } from '@angular/core/testing';

import { UiConfirmComponent } from './ui-confirm.component';

describe('UiConfirmComponent', () => {
  it('shows the summary and emits confirm or cancel', () => {
    const fixture = TestBed.createComponent(UiConfirmComponent);
    const confirmed: number[] = [];
    const cancelled: number[] = [];
    fixture.componentInstance.confirmed.subscribe(() => confirmed.push(1));
    fixture.componentInstance.cancelled.subscribe(() => cancelled.push(1));
    fixture.componentRef.setInput('message', '¿Estás seguro que deseas registrar una nueva sede con los datos ingresados?');
    fixture.componentRef.setInput('details', [{ label: 'Nombre', value: 'Trujillo' }]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.getAttribute('role')).toBe('dialog');
    expect(text).toContain('Confirmación');
    expect(text).toContain('nueva sede');
    expect(text).toContain('Nombre:');
    expect(text).toContain('Trujillo');

    (fixture.nativeElement.querySelector('.confirm__card') as HTMLElement).click();
    expect(cancelled).toEqual([]);
    (fixture.nativeElement.querySelector('.confirm__cancel') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.confirm__accept') as HTMLButtonElement).click();

    expect(cancelled).toEqual([1]);
    expect(confirmed).toEqual([1]);
  });
});
