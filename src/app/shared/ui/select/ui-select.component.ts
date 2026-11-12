import { Component, ElementRef, computed, input, model, signal, viewChild } from '@angular/core';

import { UiIconComponent } from '../icon/ui-icon.component';

export interface UiSelectOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'ui-select',
  imports: [UiIconComponent],
  templateUrl: './ui-select.component.html',
  styleUrl: './ui-select.component.css',
})
export class UiSelectComponent {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly UiSelectOption[]>();
  readonly placeholder = input<string>('Selecciona una opción');
  readonly disabled = input(false);
  readonly required = input(false);
  readonly searchable = input(true);
  readonly error = input<string>();
  readonly value = model('');
  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(-1);
  protected readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly selectedLabel = computed(() =>
    this.options().find((option) => option.value === this.value())?.label ?? this.placeholder(),
  );
  protected readonly filteredOptions = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('es');
    return query ? this.options().filter((option) => option.label.toLocaleLowerCase('es').includes(query)) : this.options();
  });

  protected toggle(): void {
    if (this.disabled()) return;
    this.open.update((isOpen) => !isOpen);
    if (this.open()) {
      this.query.set('');
      this.activeIndex.set(this.filteredOptions().findIndex((option) => option.value === this.value()));
      setTimeout(() => this.searchInput()?.nativeElement.focus());
    }
  }

  protected close(): void { this.open.set(false); this.query.set(''); this.activeIndex.set(-1); }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected select(option: UiSelectOption): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { this.close(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) { this.toggle(); return; }
      const enabled = this.filteredOptions().filter((option) => !option.disabled);
      if (!enabled.length) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex.set((this.activeIndex() + delta + enabled.length) % enabled.length);
      return;
    }
    if (event.key === 'Enter' && this.open()) {
      event.preventDefault();
      const enabled = this.filteredOptions().filter((option) => !option.disabled);
      const option = enabled[this.activeIndex()];
      if (option) this.select(option);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && (event.currentTarget as HTMLElement).contains(nextTarget)) return;
    this.close();
  }
}
