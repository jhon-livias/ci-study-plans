import { Component, computed, input, model, output, signal } from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';

@Component({
  selector: 'ui-field',
  templateUrl: './ui-field.component.html',
  styleUrl: './ui-field.component.css',
})
export class UiFieldComponent implements FormValueControl<string> {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'email' | 'number' | 'password' | 'search' | 'tel' | 'text'>('text');
  readonly autocomplete = input<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touched = input(false);
  readonly placeholder = input<string>('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly showPasswordToggle = input(false);
  readonly value = model('');
  readonly touch = output<void>();

  protected readonly message = computed(() => this.error() ?? (this.touched() ? this.errors()[0]?.message : undefined));
  protected readonly passwordVisible = signal(false);
  protected readonly inputType = computed(() =>
    this.type() === 'password' && this.passwordVisible() ? 'text' : this.type(),
  );

  protected onValueChange(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected onBlur(): void {
    this.touch.emit();
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }
}
