// ============================================================
// ShieldPay Admin Comms Function
// Handles: SMS (Africa's Talking), WhatsApp (Africa's Talking),
//          Email (any SMTP/SendGrid), and future providers
// POST /comms/send   — send message to business owner
// POST /comms/bulk   — bulk message all businesses by filter
// GET  /comms/log    — get comms history
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON    = Deno.env.get("SUPABASE_ANON_KEY")!;

// ── Africa's Talking ─────────────────────────────────────────
const AT_API_KEY   = Deno.env.get("AT_API_KEY") ?? "";
const AT_USERNAME  = Deno.env.get("AT_USERNAME") ?? "sandbox";
const AT_SENDER_ID = Deno.env.get("AT_SENDER_ID") ?? "ShieldPay";
const AT_BASE      = AT_USERNAME === "sandbox"
  ? "https://api.sandbox.africastalking.com"
  : "https://api.africastalking.com";

// ── SendGrid (email fallback) ─────────────────────────────────
const SENDGRID_KEY      = Deno.env.get("SENDGRID_API_KEY") ?? "";
const SENDGRID_FROM     = Deno.env.get("SENDGRID_FROM_EMAIL") ?? "noreply@shieldpay.ke";
const SENDGRID_FROM_NAME = "ShieldPay";

const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE);

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ── Auth: only super admins can send comms ────────────────────
async function isAdmin(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await createClient(SUPABASE_URL, SUPABASE_ANON).auth.getUser(token);
  if (!user) return null;
  // Check admin_admins table OR is super admin email
  const { data } = await supa.from("admin_admins")
    .select("id").eq("user_id", user.id).eq("is_active", true).maybeSingle();
  const isSuperAdmin = user.email === "diondickson3@gmail.com";
  return (data || isSuperAdmin) ? user.id : null;
}

// ── SMS via Africa's Talking ──────────────────────────────────
async function sendSMS(
  to: string, message: string
): Promise<{ success: boolean; ref?: string; error?: string }> {
  if (!AT_API_KEY) return { success: false, error: "AT_API_KEY not set" };

  // Normalize Kenyan phone number
  const phone = to.replace(/^0/, "+254").replace(/^\+?254/, "+254");

  const res = await fetch(`${AT_BASE}/version1/messaging`, {
    method: "POST",
    headers: {
      "apiKey":       AT_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept":       "application/json",
    },
    body: new URLSearchParams({
      username: AT_USERNAME,
      to:       phone,
      message,
      from:     AT_SENDER_ID,
    }),
  });

  const data = await res.json();
  const recipient = data?.SMSMessageData?.Recipients?.[0];
  if (recipient?.status === "Success") {
    return { success: true, ref: recipient.messageId };
  }
  return { success: false, error: recipient?.status ?? "Unknown error" };
}

// ── WhatsApp via Africa's Talking ─────────────────────────────
async function sendWhatsApp(
  to: string, message: string
): Promise<{ success: boolean; ref?: string; error?: string }> {
  if (!AT_API_KEY) return { success: false, error: "AT_API_KEY not set" };

  const phone = to.replace(/^0/, "+254").replace(/^\+?254/, "+254");

  const res = await fetch(`${AT_BASE}/version1/messaging/whatsapp`, {
    method: "POST",
    headers: {
      "apiKey":       AT_API_KEY,
      "Content-Type": "application/json",
      "Accept":       "application/json",
    },
    body: JSON.stringify({
      username: AT_USERNAME,
      to:       phone,
      message:  { type: "text", text: { body: message } },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }
  const data = await res.json();
  return { success: true, ref: data?.messageId };
}

// ── Email via SendGrid ────────────────────────────────────────
async function sendEmail(
  to: string, subject: string, htmlBody: string, textBody: string
): Promise<{ success: boolean; ref?: string; error?: string }> {
  if (!SENDGRID_KEY) return { success: false, error: "SENDGRID_API_KEY not set" };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject }],
      from: { email: SENDGRID_FROM, name: SENDGRID_FROM_NAME },
      content: [
        { type: "text/plain", value: textBody },
        { type: "text/html",  value: htmlBody },
      ],
    }),
  });

  if (res.status === 202) return { success: true, ref: res.headers.get("X-Message-Id") ?? "" };
  const err = await res.text();
  return { success: false, error: err };
}

// ── Log communication ─────────────────────────────────────────
async function logComm(params: {
  businessId?: string; recipient: string; channel: string;
  provider: string; message: string; subject?: string;
  status: string; providerRef?: string; errorDetail?: string;
  sentBy?: string;
}): Promise<void> {
  await supa.from("comms_log").insert({
    business_id:  params.businessId ?? null,
    recipient:    params.recipient,
    channel:      params.channel,
    provider:     params.provider,
    message:      params.message,
    subject:      params.subject ?? null,
    status:       params.status,
    provider_ref: params.providerRef ?? null,
    error_detail: params.errorDetail ?? null,
    sent_by:      params.sentBy ?? null,
  });
}

// ── Build branded message templates ──────────────────────────
function buildMessage(template: string, vars: Record<string, string>): string {
  const templates: Record<string, string> = {
    trial_expiring:
      `Hi {{name}}, your ShieldPay trial expires in {{days}} days. Subscribe now for KES {{price}}/month to keep your bill automations running. Reply SUBSCRIBE or visit shieldpay.ke`,

    trial_expired:
      `Hi {{name}}, your ShieldPay trial has expired. Your bill automations are paused. Subscribe for KES {{price}}/month to reactivate. Visit shieldpay.ke or call us.`,

    subscription_activated:
      `✅ ShieldPay subscription activated! Plan: {{plan}} · Period: {{period}} · Ref: {{ref}}. Your bill automations are live. Thank you!`,

    payment_executed:
      `ShieldPay: Payment of KES {{amount}} to {{supplier}} executed. Ref: {{ref}}. Receipt available on your dashboard.`,

    payment_failed:
      `⚠️ ShieldPay: Payment of KES {{amount}} to {{supplier}} FAILED. Reason: {{reason}}. Please log in to retry.`,

    custom: `{{message}}`,
  };

  let msg = templates[template] ?? templates.custom;
  for (const [key, val] of Object.entries(vars)) {
    msg = msg.replace(new RegExp(`{{${key}}}`, "g"), val);
  }
  return msg;
}

// ─── Main handler ─────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url  = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/comms/, "");

  try {
    // ── Send single message ──────────────────────────────────
    // POST /send  { businessId?, recipient, channel, template?, message?, subject?, vars? }
    if (path === "/send" && req.method === "POST") {
      const adminId = await isAdmin(req);
      if (!adminId) return json({ error: "Unauthorized" }, 401);

      const {
        businessId, recipient, channel, template,
        message: rawMessage, subject, vars = {},
      } = await req.json();

      if (!recipient || !channel) return json({ error: "recipient + channel required" }, 400);

      const message = template ? buildMessage(template, vars) : rawMessage;
      if (!message) return json({ error: "message or template required" }, 400);

      let result: { success: boolean; ref?: string; error?: string };
      let provider = "";

      if (channel === "sms") {
        provider = "africastalking";
        result = await sendSMS(recipient, message);
      } else if (channel === "whatsapp") {
        provider = "africastalking";
        result = await sendWhatsApp(recipient, message);
      } else if (channel === "email") {
        provider = "sendgrid";
        const htmlBody = `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="background:#0f4c2a;padding:16px 24px;border-radius:12px;margin-bottom:24px">
            <h2 style="color:white;margin:0;font-size:18px">🛡️ ShieldPay</h2>
          </div>
          <p style="color:#334155;font-size:15px;line-height:1.6">${message.replace(/\n/g, "<br>")}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px">ShieldPay · Automated bill payments for Kenyan SMEs · shieldpay.ke</p>
        </div>`;
        result = await sendEmail(recipient, subject ?? "Message from ShieldPay", htmlBody, message);
      } else {
        return json({ error: `Unsupported channel: ${channel}` }, 400);
      }

      await logComm({
        businessId, recipient, channel, provider, message, subject,
        status:      result.success ? "sent" : "failed",
        providerRef: result.ref,
        errorDetail: result.error,
        sentBy:      adminId,
      });

      return json({ ok: result.success, ref: result.ref, error: result.error });
    }

    // ── Bulk message ─────────────────────────────────────────
    // POST /bulk  { filter: 'trial_expiring'|'all'|'active'|'expired', channel, template, vars? }
    if (path === "/bulk" && req.method === "POST") {
      const adminId = await isAdmin(req);
      if (!adminId) return json({ error: "Unauthorized" }, 401);

      const { filter, channel, template, vars = {}, subject } = await req.json();

      // Get businesses based on filter
      let query = supa.from("businesses").select("id, name, email, phone, plan, status, trial_ends_at");

      if (filter === "trial_expiring") {
        const threeDays = new Date(Date.now() + 3 * 86400_000).toISOString();
        query = query.eq("status", "trial").lt("trial_ends_at", threeDays);
      } else if (filter === "trial_expired") {
        query = query.eq("status", "trial").lt("trial_ends_at", new Date().toISOString());
      } else if (filter === "active") {
        query = query.eq("status", "active");
      } else if (filter === "suspended") {
        query = query.eq("status", "suspended");
      }
      // "all" = no filter

      const { data: businesses } = await query;
      if (!businesses?.length) return json({ ok: true, sent: 0, message: "No businesses matched filter" });

      let sent = 0; let failed = 0;
      const PRICE_MAP: Record<string, number> = { starter: 1499, growth: 2999 };

      for (const biz of businesses) {
        const recipient = channel === "email" ? biz.email : biz.phone;
        if (!recipient) { failed++; continue; }

        const trialDays = biz.trial_ends_at
          ? Math.max(0, Math.ceil((new Date(biz.trial_ends_at).getTime() - Date.now()) / 86400_000))
          : 0;

        const mergedVars = {
          name:    biz.name,
          days:    String(trialDays),
          price:   String(PRICE_MAP[biz.plan] ?? 1499),
          plan:    biz.plan,
          ...vars,
        };

        const message = buildMessage(template, mergedVars);

        let result: { success: boolean; ref?: string; error?: string };
        let provider = "";

        if (channel === "sms") {
          provider = "africastalking"; result = await sendSMS(recipient, message);
        } else if (channel === "whatsapp") {
          provider = "africastalking"; result = await sendWhatsApp(recipient, message);
        } else if (channel === "email") {
          provider = "sendgrid";
          const html = `<p style="font-family:Inter,sans-serif;color:#334155">${message.replace(/\n/g,"<br>")}</p>`;
          result = await sendEmail(recipient, subject ?? "Message from ShieldPay", html, message);
        } else {
          continue;
        }

        await logComm({
          businessId: biz.id, recipient, channel, provider, message, subject,
          status: result.success ? "sent" : "failed",
          providerRef: result.ref, errorDetail: result.error, sentBy: adminId,
        });

        if (result.success) sent++; else failed++;
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
      }

      return json({ ok: true, sent, failed, total: businesses.length });
    }

    // ── Get comms log ────────────────────────────────────────
    // GET /log?businessId=xxx&limit=50
    if (path === "/log" && req.method === "GET") {
      const adminId = await isAdmin(req);
      if (!adminId) return json({ error: "Unauthorized" }, 401);

      const businessId = url.searchParams.get("businessId");
      const limit = parseInt(url.searchParams.get("limit") ?? "50");

      let query = supa.from("comms_log").select("*").order("created_at", { ascending: false }).limit(limit);
      if (businessId) query = query.eq("business_id", businessId);

      const { data, error } = await query;
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, logs: data });
    }

    // ── Activate subscription ────────────────────────────────
    // POST /subscribe  { businessId, plan, paymentRef, amount, months? }
    if (path === "/subscribe" && req.method === "POST") {
      const adminId = await isAdmin(req);
      if (!adminId) return json({ error: "Unauthorized" }, 401);

      const { businessId, plan, paymentRef, amount, months = 1 } = await req.json();
      if (!businessId || !plan || !paymentRef || !amount) {
        return json({ error: "businessId, plan, paymentRef, amount required" }, 400);
      }

      const { data: subId, error } = await supa.rpc("activate_subscription", {
        p_business_id: businessId,
        p_plan:        plan,
        p_payment_ref: paymentRef,
        p_amount:      amount,
        p_admin_id:    adminId,
        p_months:      months,
      });

      if (error) return json({ error: error.message }, 500);

      // Auto-send confirmation SMS + email to business owner
      const { data: biz } = await supa.from("businesses")
        .select("name, phone, email, plan").eq("id", businessId).single();

      if (biz) {
        const endDate = new Date(Date.now() + months * 30 * 86400_000)
          .toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" });

        const msgVars = {
          name: biz.name, plan: plan.charAt(0).toUpperCase() + plan.slice(1),
          period: `${new Date().toLocaleDateString("en-KE")} - ${endDate}`,
          ref: paymentRef,
        };

        const message = buildMessage("subscription_activated", msgVars);

        // Send SMS
        if (biz.phone) {
          const smsResult = await sendSMS(biz.phone, message);
          await logComm({
            businessId, recipient: biz.phone, channel: "sms",
            provider: "africastalking", message,
            status: smsResult.success ? "sent" : "failed",
            providerRef: smsResult.ref, sentBy: adminId,
          });
        }

        // Send email
        if (biz.email) {
          const html = `<p style="font-family:Inter,sans-serif;color:#334155">${message.replace(/\n/g,"<br>")}</p>`;
          const emailResult = await sendEmail(biz.email, "🎉 ShieldPay subscription activated!", html, message);
          await logComm({
            businessId, recipient: biz.email, channel: "email",
            provider: "sendgrid", message,
            status: emailResult.success ? "sent" : "failed",
            providerRef: emailResult.ref, sentBy: adminId,
          });
        }
      }

      return json({ ok: true, subscriptionId: subId });
    }

    // ── Get subscription health ──────────────────────────────
    // GET /subscriptions?filter=all|trial_expiring|active
    if (path === "/subscriptions" && req.method === "GET") {
      const adminId = await isAdmin(req);
      if (!adminId) return json({ error: "Unauthorized" }, 401);

      const filter = url.searchParams.get("filter") ?? "all";
      let query = supa.from("v_subscription_health").select("*");

      if (filter === "trial_expiring") query = query.eq("health_status", "trial_expiring");
      else if (filter === "trial_expired") query = query.eq("health_status", "trial_expired");
      else if (filter === "renewal_due")   query = query.eq("health_status", "renewal_due");
      else if (filter === "healthy")       query = query.eq("health_status", "healthy");

      const { data, error } = await query;
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, businesses: data });
    }

    return json({ error: "Not found" }, 404);
  } catch (e: any) {
    console.error("comms error:", e);
    return json({ error: e.message }, 500);
  }
});
