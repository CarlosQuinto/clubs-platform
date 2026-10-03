export function seasonLabel(value: string) {
  return value.replace(/[^0-9-]/g, "").slice(0, 11);
}

export function lettersAndNumbers(value: string, max: number) {
  return value.replace(/[^\p{L}\p{N} ]/gu, "").slice(0, max);
}

export function digitsOnly(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
