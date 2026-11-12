import { Component } from '@angular/core';

import { UiBrandComponent } from '../../shared/ui/brand/ui-brand.component';

@Component({
  selector: 'app-public-layout',
  imports: [UiBrandComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css',
})
export class PublicLayoutComponent {}
