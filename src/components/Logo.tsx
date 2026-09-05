import { LogoIcon } from "@/components/LogoIcon";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 32,
  withText = true,
}: {
  className?: string;
  size?: number;
  withText?: boolean;
}) {
  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-2", className)}>
      <LogoIcon size={size} className="shrink-0" />
      {withText ? (
        <span className="truncate text-lg font-extrabold tracking-tight text-foreground">
          AcompanhaAí
        </span>
      ) : null}
    </span>
  );
}
