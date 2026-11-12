import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiTableComponent } from './ui-table.component';

describe('UiTableComponent', () => {
  let fixture: ComponentFixture<UiTableComponent>;
  let component: UiTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiTableComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'users', label: 'Usuarios', sortable: true, align: 'center' },
    ]);
    fixture.componentRef.setInput('rows', [
      { name: 'Docente', users: 197 },
      { name: 'Alumnos', users: 3679 },
    ]);
    fixture.detectChanges();
  });

  it('orders a sortable column and announces the direction', () => {
    const sortChange = vi.fn();
    component.sortChange.subscribe(sortChange);

    const header = fixture.nativeElement.querySelector('.table-card__sort') as HTMLButtonElement;
    header.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('tbody td').textContent.trim()).toBe('Alumnos');
    expect(fixture.nativeElement.querySelector('th').getAttribute('aria-sort')).toBe('ascending');
    expect(sortChange).toHaveBeenCalledWith({ key: 'name', direction: 'ascending' });
  });

  it('changes page size and emits its new pagination state', () => {
    const pageChange = vi.fn();
    component.pageChange.subscribe(pageChange);
    fixture.componentRef.setInput('pageSizeOptions', [2, 5]);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '2';
    select.dispatchEvent(new Event('change'));

    expect(pageChange).toHaveBeenCalledWith({ page: 0, pageSize: 2 });
  });

  it('keeps a server page intact and reports its range', () => {
    fixture.componentRef.setInput('totalItems', 12);
    fixture.componentRef.setInput('pageIndex', 1);
    fixture.componentRef.setInput('selectedPageSize', 2);
    fixture.detectChanges();

    const names = [...fixture.nativeElement.querySelectorAll('tbody td')].map((cell: HTMLElement) => cell.textContent?.trim());
    expect(names).toContain('Docente');
    expect(names).toContain('Alumnos');
    expect(fixture.nativeElement.textContent).toContain('3-4 de 12');
  });
});
