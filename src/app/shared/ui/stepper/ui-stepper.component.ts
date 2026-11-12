import { Component, input, output } from '@angular/core';

export interface UiStep {
  readonly label: string;
}

@Component({
  selector: 'ui-stepper',
  templateUrl: './ui-stepper.component.html',
  styleUrl: './ui-stepper.component.css',
})
export class UiStepperComponent {
  readonly steps = input.required<readonly UiStep[]>();
  readonly active = input(0);
  readonly stepChange = output<number>();

  protected select(index: number): void {
    if (index === this.active()) return;
    this.stepChange.emit(index);
  }
}
