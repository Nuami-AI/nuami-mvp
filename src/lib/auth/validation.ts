export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** 로그인/관리용 계정키. 테스트 계정은 이메일 형식이 아니어도 됩니다. */
export function isValidAccountKey(value: string): boolean {
  const id = value.trim();
  return id.length >= 1 && id.length <= 191 && !/\s/.test(id);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
