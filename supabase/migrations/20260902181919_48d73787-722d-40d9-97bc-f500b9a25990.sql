CREATE POLICY "service role manages payment webhook events"
  ON public.payment_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);