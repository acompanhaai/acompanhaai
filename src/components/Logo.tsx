import icone from "@/assets/icone.png.asset.json";
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
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img src={icone.url} alt="AcompanhaAí" width={size} height={size} className="shrink-0" />
      {withText ? (
        <span className="text-lg font-extrabold tracking-tight text-foreground">AcompanhaAí</span>
      ) : null}
    </span>
  );
}
