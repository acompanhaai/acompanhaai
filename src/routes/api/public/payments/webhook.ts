import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";
import { PRODUCT_TO_PLAN } from "@/lib/plan";

let _supabase: ReturnType<typeof createClient<any>> | null = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) throw new Error("Payment database is not configured");
    _supabase = createClient<any>(url, key);
  }
  return _supabase;
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  if (!userId) {
    console.error("No userId in customData");
    return;
  }

  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId");
    return;
  }

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        paddle_subscription_id: id,
        paddle_customer_id: customerId,
        product_id: productId,
        price_id: priceId,
        status,
        current_period_start: currentBillingPeriod?.startsAt,
        current_period_end: currentBillingPeriod?.endsAt,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );

  const planId = PRODUCT_TO_PLAN[productId] ?? "free";
  const { error } = await getSupabase().rpc("apply_subscription_plan", {
    _user_id: userId,
    _plan: planId,
    _status: status ?? "active",
    _period_start: currentBillingPeriod?.startsAt ?? new Date().toISOString(),
    _period_end: currentBillingPeriod?.endsAt ?? null,
  });
  if (error) throw error;
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange } = data;
  const { error } = await getSupabase()
    .from("subscriptions")
    .update({
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env);
  if (error) throw error;

  const subscription = await getSupabase()
    .from("subscriptions")
    .select("user_id, product_id")
    .eq("paddle_subscription_id", id)
    .eq("environment", env)
    .maybeSingle();
  if (subscription.error || !subscription.data) throw subscription.error ?? new Error("Subscription not found");
  const planUpdate = await getSupabase().rpc("apply_subscription_plan", {
    _user_id: subscription.data.user_id,
    _plan: PRODUCT_TO_PLAN[subscription.data.product_id] ?? "free",
    _status: status ?? "active",
    _period_start: currentBillingPeriod?.startsAt ?? new Date().toISOString(),
    _period_end: currentBillingPeriod?.endsAt ?? null,
  });
  if (planUpdate.error) throw planUpdate.error;
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const { error } = await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
  if (error) throw error;

  const subscription = await getSupabase()
    .from("subscriptions")
    .select("user_id, product_id, current_period_start, current_period_end")
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env)
    .maybeSingle();
  if (subscription.error || !subscription.data) throw subscription.error ?? new Error("Subscription not found");
  const planUpdate = await getSupabase().rpc("apply_subscription_plan", {
    _user_id: subscription.data.user_id,
    _plan: PRODUCT_TO_PLAN[subscription.data.product_id] ?? "free",
    _status: "canceled",
    _period_start: subscription.data.current_period_start,
    _period_end: subscription.data.current_period_end,
  });
  if (planUpdate.error) throw planUpdate.error;
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    default:
      console.log("Unhandled event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
