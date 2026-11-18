export interface CourseDraft {
  readonly id: string;
  readonly cycleId: string;
  readonly position: string;
  readonly code: string;
  readonly name: string;
  readonly credits: string;
}

export interface PlanCourseRef {
  readonly id: string;
  readonly cycleId: string;
  readonly position: number;
  readonly code: string;
}

export interface CourseFieldErrors {
  readonly position: string;
  readonly code: string;
  readonly name: string;
  readonly credits: string;
}

const COURSE_CODE = /^(?=.*[A-Z])[A-Z0-9-]{2,16}$/u;

export const emptyCourseErrors = (): CourseFieldErrors => ({ position: '', code: '', name: '', credits: '' });

export const cycleError = (value: string, numbers: readonly number[]): string => {
  const trimmed = value.trim();
  if (!trimmed) return 'El ciclo es obligatorio.';
  const number = Number(trimmed);
  if (!Number.isInteger(number) || number < 1 || number > 20) return 'El ciclo debe ser un número del 1 al 20.';
  if (numbers.includes(number)) return 'Ese ciclo ya existe en el plan.';
  return '';
};

export const courseFieldErrors = (draft: CourseDraft, courses: readonly PlanCourseRef[]): CourseFieldErrors => {
  const others = courses.filter((course) => course.id !== draft.id);
  return {
    position: positionError(draft, others),
    code: codeError(draft, others),
    name: nameError(draft.name),
    credits: creditsError(draft.credits),
  };
};

export const hasCourseErrors = (errors: CourseFieldErrors): boolean =>
  errors.position !== '' || errors.code !== '' || errors.name !== '' || errors.credits !== '';

export const pdfBytesError = (size: number, header: Uint8Array): string => {
  if (size <= 0) return 'Elige un PDF.';
  if (size > 8_000_000) return 'El archivo debe ser un PDF de hasta 8 MB.';
  const pdf = header.length >= 5
    && header[0] === 0x25
    && header[1] === 0x50
    && header[2] === 0x44
    && header[3] === 0x46
    && header[4] === 0x2d;
  return pdf ? '' : 'El archivo no es un PDF.';
};

const positionError = (draft: CourseDraft, others: readonly PlanCourseRef[]): string => {
  const trimmed = draft.position.trim();
  if (!trimmed) return 'El orden es obligatorio.';
  const position = Number(trimmed);
  if (!Number.isInteger(position) || position < 1 || position > 40) return 'El orden debe ser un número del 1 al 40.';
  const taken = others.some((course) => course.cycleId === draft.cycleId && course.position === position);
  return taken ? 'Ese orden ya está ocupado en el ciclo.' : '';
};

const codeError = (draft: CourseDraft, others: readonly PlanCourseRef[]): string => {
  const code = draft.code.trim();
  if (!code) return 'El código es obligatorio.';
  if (!COURSE_CODE.test(code)) return 'El código usa letras, números o guion, por ejemplo EG101 o EE-301.';
  const taken = others.some((course) => course.code === code);
  return taken ? 'Ya existe un curso con ese código en el plan.' : '';
};

const nameError = (value: string): string => {
  const name = value.trim();
  if (!name) return 'El curso es obligatorio.';
  if (name.length < 3 || name.length > 180) return 'El nombre debe tener entre 3 y 180 caracteres.';
  return '';
};

const creditsError = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return 'Los créditos son obligatorios.';
  const credits = Number(trimmed);
  const halfStep = Number.isFinite(credits) && Math.abs(credits * 2 - Math.round(credits * 2)) < 1e-9;
  if (!halfStep || credits < 0.5 || credits > 20) return 'Los créditos van de 0.5 en 0.5, entre 0.5 y 20.';
  return '';
};
