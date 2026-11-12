import { Component, input } from '@angular/core';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'ui-alert',
  templateUrl: './ui-alert.component.html',
  styleUrl: './ui-alert.component.css',
})
export class UiAlertComponent {
  readonly tone = input<AlertTone>('info');
}
