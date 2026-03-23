-- ============================================================
-- Migration 007: Production Ready — Add missing columns + indexes
-- Run this in Supabase SQL Editor after all previous migrations
-- ============================================================

-- ─── Add stk_checkout_id to payment_requests (for KCB Buni callback matching) ──
ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS stk_checkout_id TEXT;

-- ─── Add phone to businesses (needed for SMS/WhatsApp) ────────
-- (column likely already exists but ensure it)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ─── Ensure admin_admins table exists (from migration 006) ────
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_admins' AND policyname='aa_all') THEN
    CREATE POLICY aa_all ON admin_admins FOR ALL USING (
      auth.uid() IN (SELECT user_id FROM admin_admins WHERE is_active = TRUE)
      OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'diondickson3@gmail.com'
    );
  END IF;
END $$;

-- ─── Ensure subscriptions table exists ────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id          UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL CHECK (plan IN ('starter','growth','enterprise')),
  status               TEXT NOT NULL DEFAULT 'trial'
                       CHECK (status IN ('trial','active','past_due','cancelled','expired')),
  amount_kes           NUMERIC(10,2) NOT NULL DEFAULT 0,
  billing_cycle        TEXT NOT NULL DEFAULT 'monthly',
  trial_ends_at        TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  last_payment_ref     TEXT,
  last_payment_date    TIMESTAMPTZ,
  last_payment_amount  NUMERIC(10,2),
  auto_renew           BOOLEAN NOT NULL DEFAULT TRUE,
  cancel_reason        TEXT,
  notes                TEXT,
  activated_by         UUID REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id)
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='sub_sel') THEN
    CREATE POLICY sub_sel ON subscriptions FOR SELECT USING (is_super_admin() OR is_member(business_id));
    CREATE POLICY sub_ins ON subscriptions FOR INSERT WITH CHECK (TRUE);
    CREATE POLICY sub_upd ON subscriptions FOR UPDATE USING (TRUE);
  END IF;
END $$;

-- ─── Ensure comms_log exists ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comms_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE SET NULL,
  recipient     TEXT NOT NULL,
  channel       TEXT NOT NULL CHECK (channel IN ('sms','whatsapp','email','push')),
  provider      TEXT NOT NULL,
  template_id   TEXT,
  subject       TEXT,
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','sent','delivered','failed')),
  provider_ref  TEXT,
  error_detail  TEXT,
  sent_by       UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comms_biz  ON comms_log(business_id, created_at DESC);
ALTER TABLE comms_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comms_log' AND policyname='cl_sel') THEN
    CREATE POLICY cl_sel ON comms_log FOR SELECT USING (is_super_admin());
    CREATE POLICY cl_ins ON comms_log FOR INSERT WITH CHECK (TRUE);
    CREATE POLICY cl_upd ON comms_log FOR UPDATE USING (is_super_admin());
  END IF;
END $$;

-- ─── Ensure external_bills exists ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.external_bills (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  integration_id  UUID NOT NULL REFERENCES accounting_integrations(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN ('quickbooks','zoho','manual')),
  external_id     TEXT NOT NULL,
  doc_number      TEXT,
  vendor_id       TEXT,
  vendor_name     TEXT NOT NULL,
  vendor_email    TEXT,
  vendor_kra_pin  TEXT,
  total_amount    NUMERIC(14,2) NOT NULL,
  tax_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_amount      NUMERIC(14,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'KES',
  due_date        DATE NOT NULL,
  bill_date       DATE NOT NULL,
  description     TEXT,
  line_items      JSONB DEFAULT '[]',
  attachment_url  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','skipped','error')),
  accepted_schedule_id UUID REFERENCES payment_schedules(id) ON DELETE SET NULL,
  kra_pin_missing BOOLEAN NOT NULL DEFAULT FALSE,
  raw_payload     JSONB,
  pulled_at       TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  UNIQUE (integration_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_eb_biz ON external_bills(business_id, status, due_date);
ALTER TABLE external_bills ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='external_bills' AND policyname='eb_sel') THEN
    CREATE POLICY eb_sel ON external_bills FOR SELECT USING (is_super_admin() OR is_member(business_id));
    CREATE POLICY eb_ins ON external_bills FOR INSERT WITH CHECK (TRUE);
    CREATE POLICY eb_upd ON external_bills FOR UPDATE USING (is_biz_admin(business_id) OR is_super_admin());
  END IF;
END $$;

-- ─── activate_subscription function ──────────────────────────
CREATE OR REPLACE FUNCTION activate_subscription(
  p_business_id UUID, p_plan TEXT, p_payment_ref TEXT,
  p_amount NUMERIC, p_admin_id UUID, p_months INT DEFAULT 1
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub_id UUID;
  v_start  TIMESTAMPTZ := NOW();
  v_end    TIMESTAMPTZ := NOW() + (p_months || ' months')::INTERVAL;
BEGIN
  INSERT INTO subscriptions (
    business_id, plan, status, amount_kes, billing_cycle,
    current_period_start, current_period_end,
    last_payment_ref, last_payment_date, last_payment_amount,
    auto_renew, activated_by
  ) VALUES (
    p_business_id, p_plan, 'active', p_amount, 'monthly',
    v_start, v_end, p_payment_ref, NOW(), p_amount, TRUE, p_admin_id
  )
  ON CONFLICT (business_id) DO UPDATE SET
    plan = p_plan, status = 'active', amount_kes = p_amount,
    current_period_start = v_start, current_period_end = v_end,
    last_payment_ref = p_payment_ref, last_payment_date = NOW(),
    last_payment_amount = p_amount, activated_by = p_admin_id,
    updated_at = NOW()
  RETURNING id INTO v_sub_id;

  UPDATE businesses SET status = 'active', plan = p_plan, updated_at = NOW()
  WHERE id = p_business_id;

  INSERT INTO admin_actions (admin_user_id, admin_email, action, target_type, target_id, details)
  SELECT p_admin_id, email, 'activate_subscription', 'business', p_business_id,
    jsonb_build_object('plan', p_plan, 'amount', p_amount, 'ref', p_payment_ref)
  FROM auth.users WHERE id = p_admin_id;

  RETURN v_sub_id;
END; $$;

-- ─── Enforce zero platform fee on payment_schedules ───────────
-- payment_schedules doesn't have platform_fee (it lives on payment_requests only)
-- This comment confirms the schema is correct as-is.

-- ─── Summary ─────────────────────────────────────────────────
SELECT
  'admin_admins'    AS tbl, COUNT(*) FROM admin_admins    UNION ALL
  SELECT 'subscriptions',  COUNT(*) FROM subscriptions    UNION ALL
  SELECT 'comms_log',      COUNT(*) FROM comms_log        UNION ALL
  SELECT 'external_bills', COUNT(*) FROM external_bills;
