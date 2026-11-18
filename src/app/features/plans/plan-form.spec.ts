import { courseFieldErrors, cycleError, emptyCourseErrors, hasCourseErrors, pdfBytesError, type PlanCourseRef } from './plan-form';

const courses: readonly PlanCourseRef[] = [
  { id: 'a', cycleId: 'c1', position: 1, code: 'EG101' },
];

describe('validación de la malla', () => {
  it('exige el ciclo y rechaza uno repetido', () => {
    expect(cycleError('  ', [1])).toBe('El ciclo es obligatorio.');
    expect(cycleError('0', [])).toContain('1 al 20');
    expect(cycleError('2', [2])).toBe('Ese ciclo ya existe en el plan.');
    expect(cycleError('3', [2])).toBe('');
  });

  it('exige orden, código, nombre y créditos, y marca los duplicados', () => {
    const errors = courseFieldErrors({
      id: '',
      cycleId: 'c1',
      position: '1',
      code: 'EG101',
      name: ' ',
      credits: '',
    }, courses);
    expect(errors.position).toBe('Ese orden ya está ocupado en el ciclo.');
    expect(errors.code).toBe('Ya existe un curso con ese código en el plan.');
    expect(errors.name).toBe('El curso es obligatorio.');
    expect(errors.credits).toBe('Los créditos son obligatorios.');
    expect(hasCourseErrors(errors)).toBe(true);
  });

  it('acepta un curso nuevo con código institucional', () => {
    const errors = courseFieldErrors({
      id: 'a',
      cycleId: 'c1',
      position: '1',
      code: 'EE-301',
      name: 'Dibujo arquitectónico',
      credits: '3.5',
    }, courses);
    expect(errors).toEqual(emptyCourseErrors());
  });

  it('rechaza un archivo que no es PDF o supera 8 MB', () => {
    expect(pdfBytesError(0, new Uint8Array())).toBe('Elige un PDF.');
    expect(pdfBytesError(8_000_001, Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d]))).toContain('8 MB');
    expect(pdfBytesError(12, Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c]))).toBe('El archivo no es un PDF.');
    expect(pdfBytesError(5, Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe('');
  });
});
