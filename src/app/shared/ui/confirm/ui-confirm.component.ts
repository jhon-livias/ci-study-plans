import { Component, input, output } from '@angular/core';

export interface UiConfirmDetail {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'ui-confirm',
  templateUrl: './ui-confirm.component.html',
  styleUrl: './ui-confirm.component.css',
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'ui-confirm-title',
    '(click)': 'cancelled.emit()',
    '(document:keydown.escape)': 'cancelled.emit()',
  },
})
export class UiConfirmComponent {
  readonly title = input('Confirmación');
  readonly message = input.required<string>();
  readonly details = input<readonly UiConfirmDetail[]>([]);
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected keepOpen(event: Event): void {
    event.stopPropagation();
  }
}
