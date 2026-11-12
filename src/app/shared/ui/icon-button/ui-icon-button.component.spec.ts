import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiIconButtonComponent } from './ui-icon-button.component';

describe('UiIconButtonComponent', () => {
  let fixture: ComponentFixture<UiIconButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiIconButtonComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiIconButtonComponent);
    fixture.componentRef.setInput('icon', 'trash');
    fixture.componentRef.setInput('label', 'Eliminar Carlos');
    fixture.componentRef.setInput('tone', 'danger');
    fixture.detectChanges();
  });

  it('names the action and draws its icon', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Eliminar Carlos');
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.className).toContain('icon-button--danger');
  });

  it('shows a tooltip under the button', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();

    const tip = fixture.nativeElement.querySelector('.icon-button__tip') as HTMLElement;
    expect(tip.textContent?.trim()).toBe('Eliminar Carlos');
    expect(tip.getAttribute('role')).toBe('tooltip');
  });
});
