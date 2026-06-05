export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_POLICY_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: 'Almeno 12 caratteri',
    test: (password) => password.length >= 12,
  },
  {
    id: 'lowercase',
    label: 'Almeno una lettera minuscola',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'uppercase',
    label: 'Almeno una lettera maiuscola',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'number',
    label: 'Almeno un numero',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'symbol',
    label: 'Almeno un simbolo',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]

export const validatePasswordPolicy = (password: string) => {
  const checks = PASSWORD_POLICY_RULES.map((rule) => ({
    ...rule,
    valid: rule.test(password),
  }))

  return {
    checks,
    isValid: checks.every((check) => check.valid),
    missingLabels: checks.filter((check) => !check.valid).map((check) => check.label),
  }
}
