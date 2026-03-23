-- ============================================================
-- Migration 008: eTIMS Integration + KYC + Plan Rename + Any Industry
-- ============================================================

-- ─── Update plan CHECK constraint (solo/multi/enterprise) ────
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_plan_check;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_plan_check
  CHECK (plan IN ('solo','multi','enterprise','starter','growth')); -- keep old for compatibility

-- ─── Remove hard industry constraint — allow any business ────
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_industry_check;

-- ─── Add new KYC + eTIMS columns to businesses ───────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS contact_person    TEXT,
  ADD COLUMN IF NOT EXISTS kyc_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS etims_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS etims_pin         TEXT,
  ADD COLUMN IF NOT EXISTS etims_cu_serial   TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- ─── eTIMS submissions table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.etims_submissions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  payment_id          UUID REFERENCES payment_requests(id) ON DELETE SET NULL,
  receipt_id          UUID REFERENCES payment_receipts(id) ON DELETE SET NULL,
  invoice_number      TEXT NOT NULL,
  cu_serial_number    TEXT,
  invoice_date        DATE NOT NULL,
  supplier_name       TEXT NOT NULL,
  supplier_pin        TEXT,
  amount              NUMERIC(14,2) NOT NULL,
  vat_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','submitted','accepted','rejected','error')),
  submitted_at        TIMESTAMPTZ,
  response_code       TEXT,
  response_message    TEXT,
  raw_request         JSONB,
  raw_response        JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etims_biz ON etims_submissions(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_etims_pay ON etims_submissions(payment_id);
ALTER TABLE etims_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='etims_submissions' AND policyname='etims_sel') THEN
    CREATE POLICY etims_sel ON etims_submissions FOR SELECT USING (is_super_admin() OR is_member(business_id));
    CREATE POLICY etims_ins ON etims_submissions FOR INSERT WITH CHECK (TRUE);
    CREATE POLICY etims_upd ON etims_submissions FOR UPDATE USING (is_biz_admin(business_id) OR is_super_admin());
  END IF;
END $$;

-- ─── Add eTIMS columns to payment_receipts ────────────────────
ALTER TABLE public.payment_receipts
  ADD COLUMN IF NOT EXISTS etims_cu_serial      TEXT,
  ADD COLUMN IF NOT EXISTS etims_invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS etims_status         TEXT DEFAULT 'not_submitted';

-- ─── Add stk_checkout_id to payment_requests ─────────────────
ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS stk_checkout_id TEXT;

-- ─── KYC documents table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL CHECK (doc_type IN ('kra_pin','business_cert','id_front','id_back','other')),
  doc_url      TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by  UUID REFERENCES auth.users(id),
  reviewed_at  TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='kyc_documents' AND policyname='kyc_sel') THEN
    CREATE POLICY kyc_sel ON kyc_documents FOR SELECT USING (is_super_admin() OR is_member(business_id));
    CREATE POLICY kyc_ins ON kyc_documents FOR INSERT WITH CHECK (is_biz_admin(business_id) OR is_super_admin());
    CREATE POLICY kyc_upd ON kyc_documents FOR UPDATE USING (is_super_admin());
  END IF;
END $$;

-- ─── eTIMS trigger: auto-submit after payment completes ──────
CREATE OR REPLACE FUNCTION auto_etims_queue()
RETURNS TRIGGER AS $$
DECLARE v_biz businesses%ROWTYPE;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    SELECT * INTO v_biz FROM businesses WHERE id = NEW.business_id;
    IF v_biz.etims_enabled AND v_biz.kra_pin IS NOT NULL THEN
      INSERT INTO etims_submissions (
        business_id, payment_id, invoice_number, invoice_date,
        supplier_name, amount, vat_amount, status
      )
      SELECT
        NEW.business_id, NEW.id,
        'SP-' || TO_CHAR(NOW(),'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0'),
        NOW()::DATE,
        COALESCE(s.name, 'Unknown'), NEW.amount,
        ROUND(NEW.amount * 0.16, 2), 'pending'
      FROM suppliers s WHERE s.id = NEW.supplier_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_etims_queue ON payment_requests;
CREATE TRIGGER trg_etims_queue
  AFTER UPDATE ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION auto_etims_queue();

-- ─── Summary ─────────────────────────────────────────────────
SELECT 'Migration 008 complete: eTIMS + KYC + Any Industry' AS status;
