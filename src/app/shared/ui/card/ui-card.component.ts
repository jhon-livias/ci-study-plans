import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-card',
  templateUrl: './ui-card.component.html',
  styleUrl: './ui-card.component.css',
})
export class UiCardComponent {
  readonly heading = input<string>();
}
