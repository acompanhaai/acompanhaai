import { passwordStrength } from "@/lib/password";
import { cn } from "@/lib/utils";

const SEGMENT_TONE = ["bg-destructive", "bg-destructive", "bg-warning", "bg-primary", "bg-primary"];

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = passwordStrength(password);

  return (
    <div className="space-y-1" aria-live="polite">
      <div className="flex gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted transition-colors",
              i < score && SEGMENT_TONE[score],
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Força da senha: {label}</p>
    </div>
  );
}
