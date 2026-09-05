import posthog from "posthog-js";

let initialized = false;

/** No-op without VITE_POSTHOG_KEY, and only ever runs in the browser. */
export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const key = import.meta.env["VITE_POSTHOG_KEY"] as string | undefined;
  if (!key) return;
  const host =
    (import.meta.env["VITE_POSTHOG_HOST"] as string | undefined) ?? "https://us.i.posthog.com";
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !initialized) return;
  posthog.identify(userId, properties);
}
