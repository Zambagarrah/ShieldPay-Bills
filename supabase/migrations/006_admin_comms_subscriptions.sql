-- ============================================================
-- Migration 006: Admin Communications + Subscription Management
-- Adds: admin_admins (multi-admin support), subscriptions table,
--       comms_log (SMS/WhatsApp/email sent), notification_templates
-- ============================================================

-- ─── MULTIPLE SUPER ADMINS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_admins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'admin'
              CHECK (role IN ('superadmin','admin','support')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  added_by    UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY aa_all ON admin_admins FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM admin_admins WHERE is_active = TRUE)
  OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'diondickson3@gmail.com'
);

-- ─── SUBSCRIPTIONS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('starter','growth','enterprise')),
  status          TEXT NOT NULL DEFAULT 'trial'
                  CHECK (status IN ('trial','active','past_due','cancelled','expired')),
  amount_kes      NUMERIC(10,2) NOT NULL DEFAULT 0,
  billing_cycle   TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  trial_ends_at   TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  -- Payment reference from M-Pesa/bank
  last_payment_ref     TEXT,
  last_payment_date    TIMESTAMPTZ,
  last_payment_amount  NUMERIC(10,2),
  -- Auto-renewal
  auto_renew      BOOLEAN NOT NULL DEFAULT TRUE,
  cancel_reason   TEXT,
  -- Admin notes
  notes           TEXT,
  activated_by    UUID REFERENCES auth.users(id), -- which admin activated
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id)
);
CREATE TRIGGER trg_sub BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_sub_biz    ON subscriptions(business_id);
CREATE INDEX idx_sub_status ON subscriptions(status, current_period_end);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sub_sel ON subscriptions FOR SELECT
  USING (is_super_admin() OR is_member(business_id));
CREATE POLICY sub_ins ON subscriptions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY sub_upd ON subscriptions FOR UPDATE USING (TRUE);

-- ─── COMMUNICATIONS LOG ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comms_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE SET NULL,
  recipient     TEXT NOT NULL,  -- phone or email
  channel       TEXT NOT NULL CHECK (channel IN ('sms','whatsapp','email','push')),
  provider      TEXT NOT NULL,  -- 'africastalking','twilio','sendgrid','custom'
  template_id   TEXT,
  subject       TEXT,
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','sent','delivered','failed')),
  provider_ref  TEXT,           -- provider message ID
  error_detail  TEXT,
  sent_by       UUID REFERENCES auth.users(id), -- null = system automated
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comms_biz  ON comms_log(business_id, created_at DESC);
CREATE INDEX idx_comms_stat ON comms_log(status, created_at DESC);
ALTER TABLE comms_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY cl_sel ON comms_log FOR SELECT  USING (is_super_admin());
CREATE POLICY cl_ins ON comms_log FOR INSERT  WITH CHECK (TRUE);
CREATE POLICY cl_upd ON comms_log FOR UPDATE  USING (is_super_admin());

-- ─── AUTO-SUBSCRIBE ON PAYMENT ───────────────────────────────
-- Function: when admin records a subscription payment, auto-activate business
CREATE OR REPLACE FUNCTION activate_subscription(
  p_business_id   UUID,
  p_plan          TEXT,
  p_payment_ref   TEXT,
  p_amount        NUMERIC,
  p_admin_id      UUID,
  p_months        INT DEFAULT 1
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub_id UUID;
  v_price  NUMERIC;
  v_start  TIMESTAMPTZ := NOW();
  v_end    TIMESTAMPTZ := NOW() + (p_months || ' months')::INTERVAL;
BEGIN
  v_price := CASE p_plan
    WHEN 'starter'    THEN 1499
    WHEN 'growth'     THEN 2999
    WHEN 'enterprise' THEN p_amount
    ELSE 0
  END;

  -- Upsert subscription
  INSERT INTO subscriptions (
    business_id, plan, status, amount_kes, billing_cycle,
    current_period_start, current_period_end,
    last_payment_ref, last_payment_date, last_payment_amount,
    auto_renew, activated_by
  ) VALUES (
    p_business_id, p_plan, 'active', v_price, 'monthly',
    v_start, v_end,
    p_payment_ref, NOW(), p_amount,
    TRUE, p_admin_id
  )
  ON CONFLICT (business_id) DO UPDATE SET
    plan                 = p_plan,
    status               = 'active',
    amount_kes           = v_price,
    current_period_start = v_start,
    current_period_end   = v_end,
    last_payment_ref     = p_payment_ref,
    last_payment_date    = NOW(),
    last_payment_amount  = p_amount,
    activated_by         = p_admin_id,
    updated_at           = NOW()
  RETURNING id INTO v_sub_id;

  -- Update business status and plan
  UPDATE businesses SET
    status = 'active',
    plan   = p_plan,
    updated_at = NOW()
  WHERE id = p_business_id;

  -- Log admin action
  INSERT INTO admin_actions (admin_user_id, admin_email, action, target_type, target_id, details)
  SELECT p_admin_id, email, 'activate_subscription', 'business', p_business_id,
    jsonb_build_object('plan', p_plan, 'amount', p_amount, 'ref', p_payment_ref, 'months', p_months)
  FROM auth.users WHERE id = p_admin_id;

  RETURN v_sub_id;
END;
$$;

-- ─── VIEW: subscription health dashboard ─────────────────────
CREATE OR REPLACE VIEW v_subscription_health AS
SELECT
  b.id AS business_id, b.name, b.industry, b.email, b.phone,
  s.plan, s.status AS sub_status, s.amount_kes,
  s.current_period_end,
  s.last_payment_ref, s.last_payment_date,
  EXTRACT(DAY FROM (s.current_period_end - NOW()))::INT AS days_until_expiry,
  b.trial_ends_at,
  EXTRACT(DAY FROM (b.trial_ends_at - NOW()))::INT AS trial_days_left,
  CASE
    WHEN s.status = 'active' AND s.current_period_end < NOW() + INTERVAL '7 days' THEN 'renewal_due'
    WHEN s.status = 'trial'  AND b.trial_ends_at < NOW() + INTERVAL '3 days'      THEN 'trial_expiring'
    WHEN s.status = 'trial'  AND b.trial_ends_at < NOW()                          THEN 'trial_expired'
    WHEN s.status = 'active'                                                       THEN 'healthy'
    ELSE s.status
  END AS health_status
FROM businesses b
LEFT JOIN subscriptions s ON s.business_id = b.id
ORDER BY b.created_at DESC;
