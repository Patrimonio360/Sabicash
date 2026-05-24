export const BASE_ALLOWANCE = 10;
export const POINTS_TO_CENTS = 50; // 50 pts = 0,10 €
export const CENTS_VALUE = 0.10;

export function fmt(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

export function calcNextAllowance(allowance, spent, recoveryLevel) {
  const threshold = allowance * 0.5;
  if (spent === 0) {
    if (recoveryLevel > 0) {
      const next = Math.min(recoveryLevel * 2 + 2, BASE_ALLOWANCE);
      return { amount: next, newRecoveryLevel: next >= BASE_ALLOWANCE ? 0 : recoveryLevel + 1, reason: 'recovery' };
    }
    return { amount: BASE_ALLOWANCE, newRecoveryLevel: 0, reason: 'full' };
  }
  if (spent > threshold) {
    return { amount: 0, newRecoveryLevel: 1, reason: 'penalty' };
  }
  const next = Math.max(0, allowance - spent * 2);
  return { amount: next, newRecoveryLevel: next === 0 ? 1 : 0, reason: next === 0 ? 'zero' : 'reduced' };
}

export function pointsToEuros(points) {
  const conversions = Math.floor(points / POINTS_TO_CENTS);
  return conversions * CENTS_VALUE;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
