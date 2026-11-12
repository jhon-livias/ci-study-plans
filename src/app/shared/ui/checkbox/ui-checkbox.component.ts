import { Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-checkbox',
  templateUrl: './ui-checkbox.component.html',
  styleUrl: './ui-checkbox.component.css',
})
export class UiCheckboxComponent {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly checked = model(false);

  protected onChange(event: Event): void {
    this.checked.set((event.target as HTMLInputElement).checked);
  }
}
