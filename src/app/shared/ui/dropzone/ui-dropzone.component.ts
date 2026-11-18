import { Component, input, output, signal } from '@angular/core';

import { UiButtonComponent } from '../button/ui-button.component';

@Component({
  selector: 'ui-dropzone',
  imports: [UiButtonComponent],
  templateUrl: './ui-dropzone.component.html',
  styleUrl: './ui-dropzone.component.css',
})
export class UiDropzoneComponent {
  readonly id = input.required<string>();
  readonly label = input('Archivos');
  readonly hint = input('Puedes soltar los archivos o elegirlos.');
  readonly accept = input('image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt');
  readonly multiple = input(true);
  readonly maxFiles = input(5);
  readonly disabled = input(false);
  readonly files = input<readonly File[]>([]);
  readonly filesChange = output<readonly File[]>();
  protected readonly dragging = signal(false);
  protected readonly notice = signal<string | null>(null);

  protected pick(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files) return;
    this.add(input.files);
    input.value = '';
  }

  protected drop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.disabled() || !event.dataTransfer) return;
    this.add(event.dataTransfer.files);
  }

  protected dragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) this.dragging.set(true);
  }

  protected remove(index: number): void {
    this.notice.set(null);
    this.filesChange.emit(this.files().filter((_, item) => item !== index));
  }

  private add(list: FileList): void {
    const next = [...this.files()];
    let overflow = false;
    for (const file of list) {
      if (next.length >= this.maxFiles()) {
        overflow = true;
        break;
      }
      if (next.some((item) => item.name === file.name && item.size === file.size)) continue;
      next.push(file);
    }
    this.notice.set(overflow ? `Puedes adjuntar hasta ${this.maxFiles()} archivos.` : null);
    this.filesChange.emit(next);
  }
}
