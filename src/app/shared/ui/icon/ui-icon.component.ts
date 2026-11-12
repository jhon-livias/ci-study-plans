import { Component, input } from '@angular/core';

export type UiIconName = 'edit' | 'trash' | 'key' | 'chevron-left' | 'chevron-right' | 'chevron-down';

@Component({
  selector: 'ui-icon',
  templateUrl: './ui-icon.component.html',
  styleUrl: './ui-icon.component.css',
  host: { 'aria-hidden': 'true' },
})
export class UiIconComponent {
  readonly name = input.required<UiIconName>();
}
