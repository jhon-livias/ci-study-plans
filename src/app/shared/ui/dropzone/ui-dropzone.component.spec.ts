import { TestBed } from '@angular/core/testing';

import { UiDropzoneComponent } from './ui-dropzone.component';

describe('UiDropzoneComponent', () => {
  it('agrega un PDF soltado y avisa cuando se pasa del máximo', () => {
    const fixture = TestBed.createComponent(UiDropzoneComponent);
    const received: File[][] = [];
    fixture.componentRef.setInput('id', 'syllabus');
    fixture.componentRef.setInput('label', 'Sílabo');
    fixture.componentRef.setInput('accept', 'application/pdf,.pdf');
    fixture.componentRef.setInput('multiple', false);
    fixture.componentRef.setInput('maxFiles', 1);
    fixture.componentInstance.filesChange.subscribe((files) => received.push([...files]));
    fixture.detectChanges();

    const file = new File(['%PDF-'], 'silabo.pdf', { type: 'application/pdf' });
    const extra = new File(['%PDF-'], 'otro.pdf', { type: 'application/pdf' });
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const selected = [file, extra];
    const list = { length: selected.length, item: (index: number) => selected[index] ?? null, *[Symbol.iterator]() { yield* selected; } };
    Object.defineProperty(input, 'files', { configurable: true, value: list });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(received.at(-1)?.map((item) => item.name)).toEqual(['silabo.pdf']);
    expect(fixture.nativeElement.textContent).toContain('Puedes adjuntar hasta 1 archivos.');
  });
});
