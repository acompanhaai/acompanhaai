import { z } from "zod";

/** Padrão de senha forte exigido em toda a plataforma. */
export const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter no mínimo 8 caracteres")
  .max(72, "A senha pode ter no máximo 72 caracteres")
  .regex(/[0-9]/, "A senha precisa ter ao menos um número")
  .regex(/[^A-Za-z0-9]/, "A senha precisa ter ao menos um caractere especial");

export type PasswordStrengthResult = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
};

/** Pontuação de força apenas para feedback visual — a regra que vale é passwordSchema. */
export function passwordStrength(value: string): PasswordStrengthResult {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;

  const labels = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"] as const;
  return { score: score as PasswordStrengthResult["score"], label: labels[score] ?? labels[0] };
}
