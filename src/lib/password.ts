export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "Ít nhất 8 ký tự",
    test: (password) => /^.{8,}$/.test(password),
  },
  {
    id: "lowercase",
    label: "Có chữ thường (a-z)",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "uppercase",
    label: "Có chữ hoa (A-Z)",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "Có chữ số (0-9)",
    test: (password) => /\d/.test(password),
  },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
