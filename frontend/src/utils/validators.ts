/**
 * Funções de validação para formulários e etapas de wizard no UniLocker.
 */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidUfrjEmail(email: string): boolean {
  return /@.*ufrj\.br$/i.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

export interface LocationWizardStep1Data {
  name: string;
  campus: string;
  building: string;
  floor: string;
  openingHours: string;
  accessInstructions?: string;
}

export function validateLocationStep1(data: LocationWizardStep1Data): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!data.name?.trim()) errors.name = 'O nome do ponto é obrigatório.';
  if (!data.campus?.trim()) errors.campus = 'O campus é obrigatório.';
  if (!data.building?.trim()) errors.building = 'O edifício/prédio é obrigatório.';
  if (!data.floor?.trim()) errors.floor = 'O andar/sala é obrigatório.';
  if (!data.openingHours?.trim()) errors.openingHours = 'O horário de funcionamento é obrigatório.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface LocationWizardLockerInput {
  code: string;
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
}

export function validateLocationStep2(lockers: LocationWizardLockerInput[]): { valid: boolean; error?: string } {
  if (!lockers || lockers.length === 0) {
    return { valid: false, error: 'Adicione pelo menos um compartimento de locker.' };
  }
  const codes = new Set<string>();
  for (const locker of lockers) {
    if (!locker.code?.trim()) {
      return { valid: false, error: 'Todos os armários devem ter um número/código identificador.' };
    }
    const upper = locker.code.trim().toUpperCase();
    if (codes.has(upper)) {
      return { valid: false, error: `Código de armário duplicado: ${upper}.` };
    }
    codes.add(upper);
  }
  return { valid: true };
}

export interface PricingPlanInput {
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
}

export function validateLocationStep3(plans: PricingPlanInput[]): { valid: boolean; error?: string } {
  if (!plans || plans.length === 0) {
    return { valid: false, error: 'Configure os preços para os tamanhos cadastrados.' };
  }
  for (const plan of plans) {
    if (plan.dailyPrice <= 0 || plan.weeklyPrice <= 0 || plan.monthlyPrice <= 0) {
      return { valid: false, error: `Os preços para o tamanho ${plan.size} devem ser maiores que zero.` };
    }
  }
  return { valid: true };
}
