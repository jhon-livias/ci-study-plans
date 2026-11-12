import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { UiPageHeaderComponent } from './ui-page-header.component';

describe('UiPageHeaderComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UiPageHeaderComponent],
      providers: [provideRouter([])],
    });
  });

  it('shows the breadcrumb and the page title', () => {
    const fixture = TestBed.createComponent(UiPageHeaderComponent);
    fixture.componentRef.setInput('items', [{ label: 'Inicio' }, { label: 'Módulos' }]);
    fixture.componentRef.setInput('title', 'Módulos');
    fixture.componentRef.setInput('description', 'Catálogo de módulos');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nav').textContent).toContain('Inicio');
    expect(fixture.nativeElement.querySelector('nav').textContent).toContain('Módulos');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Módulos');
    expect(fixture.nativeElement.textContent).toContain('Catálogo de módulos');
  });

  it('goes back when a breadcrumb action is chosen', () => {
    const fixture = TestBed.createComponent(UiPageHeaderComponent);
    const activate = vi.fn();
    fixture.componentInstance.activate.subscribe(activate);
    fixture.componentRef.setInput('items', [
      { label: 'Inicio', action: 'list' },
      { label: 'Usuarios' },
    ]);
    fixture.componentRef.setInput('title', 'Usuarios');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(activate).toHaveBeenCalledWith('list');
  });
});
