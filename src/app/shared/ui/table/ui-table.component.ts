import { Component, computed, input, output, signal } from '@angular/core';

import { UiIconComponent } from '../icon/ui-icon.component';
import { UiIconButtonComponent } from '../icon-button/ui-icon-button.component';

export type UiTableCell = string | number | boolean | null | undefined;
export type UiTableRow = Readonly<Record<string, UiTableCell>>;
export type UiTableSortDirection = 'ascending' | 'descending';

export interface UiTableColumn {
  readonly key: string;
  readonly label: string;
  readonly sortable?: boolean;
  readonly align?: 'start' | 'center' | 'end';
  readonly kind?: 'text' | 'switch';
}

export interface UiTableSort {
  readonly key: string;
  readonly direction: UiTableSortDirection;
}

export interface UiTablePageChange {
  readonly page: number;
  readonly pageSize: number;
}

@Component({
  selector: 'ui-table',
  imports: [UiIconComponent, UiIconButtonComponent],
  templateUrl: './ui-table.component.html',
  styleUrl: './ui-table.component.css',
})
export class UiTableComponent {
  readonly columns = input.required<readonly UiTableColumn[]>();
  readonly rows = input.required<readonly UiTableRow[]>();
  readonly totalItems = input<number | null>(null);
  readonly pageIndex = input<number | null>(null);
  readonly selectedPageSize = input<number | null>(null);
  readonly sortState = input<UiTableSort | null>(null);
  readonly pageSizeOptions = input<readonly number[]>([5, 10, 20]);
  readonly emptyMessage = input('No hay resultados para mostrar.');
  readonly actions = input(false);
  readonly allowReset = input(false);
  readonly edit = output<UiTableRow>();
  readonly remove = output<UiTableRow>();
  readonly reset = output<UiTableRow>();
  readonly toggle = output<UiTableRow>();
  readonly sortChange = output<UiTableSort>();
  readonly pageChange = output<UiTablePageChange>();

  private readonly page = signal(0);
  private readonly pageSize = signal(5);
  private readonly sort = signal<UiTableSort | null>(null);
  protected readonly remote = computed(() => this.totalItems() !== null);
  protected readonly activeSort = computed(() => this.sortState() ?? this.sort());
  protected readonly activePageSize = computed(() => this.selectedPageSize() ?? this.pageSize());
  protected readonly total = computed(() => this.totalItems() ?? this.rows().length);
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.activePageSize())));
  protected readonly currentPage = computed(() => Math.min(Math.max(this.pageIndex() ?? this.page(), 0), this.pageCount() - 1));
  protected readonly visibleRows = computed(() => {
    if (this.remote()) return this.rows();
    const sortedRows = [...this.rows()];
    const sort = this.activeSort();
    if (sort) sortedRows.sort((left, right) => this.compareCells(left[sort.key], right[sort.key], sort.direction));
    const start = this.currentPage() * this.activePageSize();
    return sortedRows.slice(start, start + this.activePageSize());
  });
  protected readonly rangeStart = computed(() => (this.total() === 0 ? 0 : this.currentPage() * this.activePageSize() + 1));
  protected readonly rangeEnd = computed(() => Math.min((this.currentPage() + 1) * this.activePageSize(), this.total()));

  protected sortColumn(column: UiTableColumn): void {
    if (!column.sortable) return;
    const currentSort = this.activeSort();
    const direction: UiTableSortDirection = currentSort?.key === column.key && currentSort.direction === 'ascending' ? 'descending' : 'ascending';
    const sort = { key: column.key, direction } as const;
    if (this.sortState() === null) this.sort.set(sort);
    if (this.pageIndex() === null) this.page.set(0);
    this.sortChange.emit(sort);
    this.pageChange.emit({ page: 0, pageSize: this.activePageSize() });
  }

  protected changePage(page: number): void {
    const nextPage = Math.min(Math.max(page, 0), this.pageCount() - 1);
    if (nextPage === this.currentPage()) return;
    if (this.pageIndex() === null) this.page.set(nextPage);
    this.pageChange.emit({ page: nextPage, pageSize: this.activePageSize() });
  }

  protected changePageSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!this.pageSizeOptions().includes(value)) return;
    if (this.selectedPageSize() === null) {
      this.pageSize.set(value);
      this.page.set(0);
    }
    this.pageChange.emit({ page: 0, pageSize: value });
  }

  protected ariaSort(column: UiTableColumn): 'none' | UiTableSortDirection {
    const sort = this.activeSort();
    return sort?.key === column.key ? sort.direction : 'none';
  }

  protected rowLabel(row: UiTableRow): string {
    const label = row['name'] ?? row['firstName'] ?? row['id'] ?? '';
    return String(label);
  }

  private compareCells(left: UiTableCell, right: UiTableCell, direction: UiTableSortDirection): number {
    const factor = direction === 'ascending' ? 1 : -1;
    if (left == null) {
      return right == null ? 0 : factor;
    }
    if (right == null) {
      return -factor;
    }
    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * factor;
    }
    return String(left).localeCompare(String(right), 'es', { numeric: true, sensitivity: 'base' }) * factor;
  }
}
