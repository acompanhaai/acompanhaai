import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";
import { PRODUCT_TO_PLAN } from "@/lib/plan";

type PaymentDatabase = ReturnType<typeof createClient<any>>;
let _supabase: PaymentDatabase | null = null;

function getSupabase(): PaymentDatabase {
  if (!_supabase) {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) throw new Error("Payment database is not configured");
    _supabase = createClient<any>(url, key);
  }
  return _supabase;
}

async function claimWebhookEvent(eventId: string, environment: PaddleEnv, eventType: string) {
  const { error } = await getSupabase().from("payment_webhook_events").insert({
    event_id: eventId,
    environment,
    event_type: eventType,
  });

  if (!error) return true;
  if (error.code === "23505") return false;
  throw error;
}

async function applyPlan(
  userId: string,
  productId: string,
  status: string,
  periodStart: string | null | undefined,
  periodEnd: string | null | undefined,
) {
  const { error } = await getSupabase().rpc("apply_subscription_plan", {
    _user_id: userId,
    _plan: PRODUCT_TO_PLAN[productId] ?? "free",
    _status: status || "active",
    _period_start: periodStart ?? new Date().toISOString(),
    _period_end: periodEnd ?? null,
  });
  if (error) throw error;
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

  const { error } = await getSupabase().from("subscriptions").upsert(
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
  if (error) throw error;
  await applyPlan(userId, productId, status, currentBillingPeriod?.startsAt, currentBillingPeriod?.endsAt);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;
  const item = items?.[0];
  const eventProductId = item?.product?.importMeta?.externalId;
  const eventPriceId = item?.price?.importMeta?.externalId;
  const { data: current, error: currentError } = await getSupabase()
    .from("subscriptions")
    .select("user_id, product_id, price_id")
    .eq("paddle_subscription_id", id)
    .eq("environment", env)
    .maybeSingle();
  if (currentError || !current) throw currentError ?? new Error("Subscription not found");

  const productId = eventProductId ?? current.product_id;
  const priceId = eventPriceId ?? current.price_id;
  const { error } = await getSupabase()
    .from("subscriptions")
    .update({
      status,
      product_id: productId,
      price_id: priceId,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env);
  if (error) throw error;
  await applyPlan(current.user_id, productId, status, currentBillingPeriod?.startsAt, currentBillingPeriod?.endsAt);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const { data: subscription, error: lookupError } = await getSupabase()
    .from("subscriptions")
    .select("user_id, product_id, current_period_start, current_period_end")
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env)
    .maybeSingle();
  if (lookupError || !subscription) throw lookupError ?? new Error("Subscription not found");

  const { error } = await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
  if (error) throw error;
  await applyPlan(subscription.user_id, subscription.product_id, "canceled", subscription.current_period_start, subscription.current_period_end);
}

async function handleTransactionPaymentFailed(data: any, env: PaddleEnv) {
  if (!data.subscriptionId) return;
  const { data: subscription, error } = await getSupabase()
    .from("subscriptions")
    .select("user_id, product_id, current_period_start, current_period_end")
    .eq("paddle_subscription_id", data.subscriptionId)
    .eq("environment", env)
    .maybeSingle();
  if (error || !subscription) throw error ?? new Error("Subscription not found");

  const { error: updateError } = await getSupabase()
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.subscriptionId)
    .eq("environment", env);
  if (updateError) throw updateError;
  await applyPlan(subscription.user_id, subscription.product_id, "past_due", subscription.current_period_start, subscription.current_period_end);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  const claimed = await claimWebhookEvent(event.eventId, env, event.eventType);
  if (!claimed) return;

  try {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionPastDue:
      case EventName.SubscriptionPaused:
      case EventName.SubscriptionResumed:
      case EventName.SubscriptionTrialing:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionPaymentFailed:
        await handleTransactionPaymentFailed(event.data, env);
        break;
      case EventName.TransactionCompleted:
      case EventName.TransactionPaid:
        console.log("Payment event received:", event.eventType);
        break;
      default:
        console.log("Unhandled event:", event.eventType);
    }
  } catch (error) {
    // Libera a reivindicação para que a tentativa automática do Paddle possa
    // reprocessar o evento após uma falha transitória de banco ou rede.
    await getSupabase().from("payment_webhook_events").delete().eq("event_id", event.eventId);
    throw error;
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const value = url.searchParams.get("env");
        if (value !== "sandbox" && value !== "live") {
          return new Response("Invalid payment environment", { status: 400 });
        }
        try {
          await handleWebhook(request, value);
          return Response.json({ received: true });
        } catch (error) {
          console.error("Webhook error:", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
