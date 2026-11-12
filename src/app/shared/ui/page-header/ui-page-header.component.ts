import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface UiBreadcrumbItem {
  readonly label: string;
  readonly href?: string;
  readonly action?: string;
}

@Component({
  selector: 'ui-page-header',
  imports: [RouterLink],
  templateUrl: './ui-page-header.component.html',
})
export class UiPageHeaderComponent {
  readonly items = input.required<readonly UiBreadcrumbItem[]>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly activate = output<string>();
}
