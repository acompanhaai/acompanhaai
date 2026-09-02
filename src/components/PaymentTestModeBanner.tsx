import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;

  return (
    <div className="w-full border-b border-border bg-muted px-4 py-2 text-center text-xs text-muted-foreground">
      Os pagamentos feitos no preview estão em modo de teste.
    </div>
  );
}
