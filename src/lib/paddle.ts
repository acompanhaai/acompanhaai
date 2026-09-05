import { getPaymentsClientToken, getPaymentsEnvironment } from "@/lib/payments-env";

interface PaddleCheckoutOpenOptions {
  items: { priceId: string; quantity: number }[];
  customer?: { email: string } | undefined;
  customData?: Record<string, unknown> | undefined;
  settings?: {
    displayMode?: "overlay" | "inline";
    frameTarget?: string | undefined;
    frameStyle?: string | undefined;
    successUrl?: string;
    allowLogout?: boolean;
    variant?: "one-page" | "multi-page";
  };
}

interface PaddleJsSdk {
  Environment: { set(environment: "sandbox" | "production"): void };
  Initialize(options: { token: string }): void;
  Checkout: { open(options: PaddleCheckoutOpenOptions): void };
}

declare global {
  interface Window {
    Paddle: PaddleJsSdk;
  }
}

export function getPaddleEnvironment(): "sandbox" | "live" {
  return getPaymentsEnvironment();
}

let paddleInitialized = false;

export async function initializePaddle() {
  if (paddleInitialized) return;
  const clientToken = getPaymentsClientToken();
  if (!clientToken) throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      const paddleJsEnvironment = getPaddleEnvironment() === "sandbox" ? "sandbox" : "production";
      window.Paddle.Environment.set(paddleJsEnvironment);
      window.Paddle.Initialize({ token: clientToken });
      paddleInitialized = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
