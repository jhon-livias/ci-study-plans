import { TestBed } from '@angular/core/testing';
import { UiSelectComponent } from './ui-select.component';

describe('UiSelectComponent', () => {
  it('filters options and emits the selected value', async () => {
    const fixture = TestBed.createComponent(UiSelectComponent);
    fixture.componentRef.setInput('id', 'department');
    fixture.componentRef.setInput('label', 'Departamento');
    fixture.componentRef.setInput('options', [
      { value: '101', label: 'AMAZONAS' },
      { value: '113', label: 'LA LIBERTAD' },
    ]);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'libertad';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('LA LIBERTAD');
    expect(fixture.nativeElement.textContent).not.toContain('AMAZONAS');
    (fixture.nativeElement.querySelector('[role="option"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('113');
  });

  it('closes with Escape', () => {
    const fixture = TestBed.createComponent(UiSelectComponent);
    fixture.componentRef.setInput('id', 'state');
    fixture.componentRef.setInput('label', 'Estado');
    fixture.componentRef.setInput('options', [{ value: 'active', label: 'Activo' }]);
    fixture.detectChanges();
    const control = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    control.click();
    control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();
  });
});
