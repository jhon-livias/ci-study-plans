import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-badge',
  templateUrl: './ui-badge.component.html',
  styleUrl: './ui-badge.component.css',
})
export class UiBadgeComponent {
  readonly tone = input<'neutral' | 'primary'>('neutral');
}
