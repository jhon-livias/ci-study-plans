import { Component, input, signal } from '@angular/core';

import { UiIconComponent, type UiIconName } from '../icon/ui-icon.component';

@Component({
  selector: 'ui-icon-button',
  imports: [UiIconComponent],
  templateUrl: './ui-icon-button.component.html',
  styleUrl: './ui-icon-button.component.css',
})
export class UiIconButtonComponent {
  readonly icon = input.required<UiIconName>();
  readonly label = input.required<string>();
  readonly tone = input<'neutral' | 'danger'>('neutral');
  readonly type = input<'button' | 'submit'>('button');
  protected readonly open = signal(false);
  protected readonly top = signal(0);
  protected readonly left = signal(0);

  protected show(event: Event): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.top.set(rect.bottom + 6);
    this.left.set(rect.left + rect.width / 2);
    this.open.set(true);
  }

  protected hide(): void {
    this.open.set(false);
  }
}
