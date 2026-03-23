import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, Mail, Lock, Eye, EyeOff, Loader2, User, Phone,
  Building2, CheckCircle2, AlertTriangle, ChevronDown, FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { clsx } from "@/lib/utils";
import { COMMON_INDUSTRIES } from "@/lib/constants";

type Mode = "login" | "register";

// ─── Terms & Privacy Modal ───────────────────────────────────
function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Shield size={15} className="text-white" />
            </div>
            <h2 className="font-black text-slate-900">Terms of Service & Privacy Policy</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm text-slate-600 leading-relaxed">

          <section>
            <h3 className="font-bold text-slate-900 text-base mb-2">1. About ShieldPay</h3>
            <p>ShieldPay is a bill payment automation platform built for Kenyan businesses. We help businesses schedule, approve, and execute payments to their suppliers and service providers through M-Pesa (via KCB Buni) and bank-to-bank transfers (via Stanbic PesaLink). ShieldPay does not hold, store, or manage client funds at any time. All money movements happen directly through licensed payment rails.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-base mb-2">2. Payment Processing</h3>
            <p className="mb-2">ShieldPay integrates with the following licensed payment processors:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>KCB Buni</strong> — for M-Pesa Paybill, Till, and Send Money transactions. KCB Bank is licensed by the Central Bank of Kenya (CBK).</li>
              <li><strong>Stanbic PesaLink</strong> — for real-time interbank transfers. Stanbic Bank is licensed by the CBK.</li>
            </ul>
            <p className="mt-2">ShieldPay acts as an orchestration layer only. We initiate payment instructions on your behalf as directed by your approved payment requests. We are not a payment service provider, bank, or money transmitter.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-base mb-2">3. Data Protection</h3>
            <p className="mb-2">ShieldPay complies with the Kenya Data Protection Act 2019 and the guidelines of the Office of the Data Protection Commissioner (ODPC). By using ShieldPay, you agree that:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your business data is stored securely on Supabase (SOC 2 Type II certified infrastructure)</li>
              <li>All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
              <li>We collect only the minimum data necessary to provide the service</li>
              <li>We do not sell, rent, or share your data with third parties except as required to process payments</li>
              <li>You may request deletion of your data at any time by contacting risewithdion@gmail.com</li>
              <li>Payment credentials (API keys, tokens) are encrypted using pgcrypto AES-256 and never stored in plaintext</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-base mb-2">4. CBK Policy Compliance</h3>
            <p>ShieldPay operates in compliance with the Central Bank of Kenya National Payments System Regulations. We do not provide payment services directly but enable businesses to use licensed PSPs. All payment transactions are subject to the terms and limits set by KCB Bank and Stanbic Bank respectively.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-base mb-2">5. eTIMS & KRA Compliance</h3>
            <p>ShieldPay provides optional eTIMS integration to help businesses comply with KRA's Electronic Tax Invoice Management System requirements. When enabled, ShieldPay automatically generates and submits electronic tax invoices for applicable transactions. You are responsible for ensuring your KRA PIN and eTIMS credentials are accurate. ShieldPay does not file taxes on your behalf — we facilitate the electronic invoice submission process only.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-base mb-2">6. Subscription & Billing</h3>
            <p>ShieldPay charges a flat monthly subscription fee (KES 1,499 for Solo Branch or KES 2,999 for Multi Branch). We do not charge per-transaction fees. Your subscription covers unlimited bill schedules and payment executions. Subscriptions are activated manually by ShieldPay upon receipt of payment. The 30-day free trial includes full access to all features with no credit card required.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-base mb-2">7. Your Responsibilities</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ensure all payee details (paybill numbers, bank accounts, phone numbers) are correct before scheduling payments</li>
              <li>Maintain accurate KRA PIN and business registration details</li>
              <li>Approve only legitimate payment requests through the platform</li>
              <li>Keep your login credentials secure and not share them</li>
              <li>Notify ShieldPay immediately of any unauthorized access</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-base mb-2">8. Limitation of Liability</h3>
            <p>ShieldPay is not liable for payments made to incorrect accounts due to errors in payee details provided by the user. We are not responsible for delays caused by third-party payment processors (KCB Buni or Stanbic PesaLink). Our total liability in any matter shall not exceed the subscription fees paid in the preceding 3 months.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-base mb-2">9. Contact</h3>
            <p>For support, disputes, or data requests contact us at <a href="mailto:risewithdion@gmail.com" className="text-primary font-semibold">risewithdion@gmail.com</a> or WhatsApp <a href="https://wa.me/254715800397" target="_blank" rel="noopener" className="text-primary font-semibold">0715 800 397</a>.</p>
          </section>

          <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
            Last updated: {new Date().toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })} · ShieldPay Kenya
          </p>
        </div>
        <div className="px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all">
            I understand — Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Auth Page ──────────────────────────────────────────
export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode]         = useState<Mode>("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError]       = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [step, setStep]         = useState<1|2>(1); // registration steps

  const [f, setF] = useState({
    // Step 1 — Who you are
    full_name:       "",
    email:           "",
    password:        "",
    phone:           "",
    // Step 2 — Your business (KYC)
    business_name:   "",
    industry:        "",
    industry_custom: "",
    kra_pin:         "",
    registration_no: "",
    contact_person:  "",
    county:          "",
    terms_accepted:  false,
  });
  const set = (k: string, v: any) => { setF(p => ({ ...p, [k]: v })); setError(""); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from("business_members")
          .select("id").eq("user_id", session.user.id).eq("status", "active").maybeSingle()
          .then(({ data }) => { navigate(data ? "/dashboard" : "/onboarding", { replace: true }); });
      } else { setChecking(false); }
    });
  }, []);

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-[3px] border-slate-200 rounded-full" />
        <div className="absolute inset-0 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const handleLogin = async () => {
    if (!f.email || !f.password) { setError("Email and password are required"); return; }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
    if (err) { setError("Incorrect email or password."); setLoading(false); return; }
    const { data: mem } = await supabase.from("business_members")
      .select("id").eq("user_id", data.user.id).eq("status","active").maybeSingle();
    navigate(mem ? "/dashboard" : "/onboarding", { replace: true });
    setLoading(false);
  };

  const validateStep1 = () => {
    if (!f.full_name.trim())  { setError("Your full name is required"); return false; }
    if (!f.email.trim())      { setError("Email address is required"); return false; }
    if (!f.phone.trim())      { setError("Phone number is required"); return false; }
    if (f.password.length < 8){ setError("Password must be at least 8 characters"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!f.business_name.trim())   { setError("Business name is required"); return false; }
    if (!f.industry && !f.industry_custom.trim()) { setError("Select or type your business type"); return false; }
    if (!f.kra_pin.trim())         { setError("KRA PIN is required for compliance"); return false; }
    if (f.kra_pin.trim().length !== 11) { setError("KRA PIN must be 11 characters (e.g. A012345678Z)"); return false; }
    if (!f.terms_accepted)         { setError("You must accept the Terms & Privacy Policy to continue"); return false; }
    return true;
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setLoading(true); setError("");

    const { data: su, error: suErr } = await supabase.auth.signUp({
      email: f.email.trim(), password: f.password,
      options: { data: { full_name: f.full_name.trim() } },
    });
    if (suErr) { setError(suErr.message); setLoading(false); return; }
    if (!su.user) { setError("Registration failed. Please try again."); setLoading(false); return; }

    const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
      email: f.email.trim(), password: f.password,
    });
    if (siErr || !si?.session) {
      setError(""); setLoading(false); setMode("login");
      alert("Account created! Check your email to confirm, then sign in.");
      return;
    }

    const industry = f.industry_custom.trim() || f.industry;

    const { data: biz, error: bizErr } = await supabase.from("businesses").insert({
      name:            f.business_name.trim(),
      industry,
      phone:           f.phone.trim() || null,
      kra_pin:         f.kra_pin.trim().toUpperCase() || null,
      registration_no: f.registration_no.trim() || null,
      contact_person:  f.contact_person.trim() || f.full_name.trim(),
      county:          f.county || null,
      email:           f.email.trim(),
      owner_user_id:   su.user.id,
      plan:            "solo",
      status:          "trial",
      trial_ends_at:   new Date(Date.now() + 30 * 86400000).toISOString(),
      terms_accepted:  true,
      terms_accepted_at: new Date().toISOString(),
    }).select().single();

    if (bizErr || !biz) { navigate("/onboarding", { replace: true }); setLoading(false); return; }

    await supabase.from("business_members").insert({
      business_id: biz.id, user_id: su.user.id,
      email: f.email.trim(), full_name: f.full_name.trim(),
      phone: f.phone.trim() || null, role: "owner", status: "active",
      joined_at: new Date().toISOString(),
    });

    navigate("/onboarding", { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 bg-primary flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <span className="font-black text-white text-xl">ShieldPay</span>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
              Your bills.<br />Automated.<br />
              <span className="text-amber-400">Forever.</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Join businesses across Kenya who never miss a bill payment again.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Works for any type of business",
              "M-Pesa + PesaLink payments",
              "eTIMS & KRA compliance built in",
              "QuickBooks · Zoho · Excel sync",
              "30-day free trial — no card needed",
            ].map(p => (
              <div key={p} className="flex items-center gap-3 text-white/80 text-sm">
                <CheckCircle2 size={16} className="text-amber-400 shrink-0" /> {p}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-white/30 text-xs">Integrated with:</p>
          <div className="flex gap-3 flex-wrap">
            {["Stanbic PesaLink","KCB Buni","KRA eTIMS","QuickBooks","Zoho Books"].map(p => (
              <span key={p} className="text-[10px] bg-white/10 text-white/60 px-2.5 py-1 rounded-full font-medium">{p}</span>
            ))}
          </div>
          <p className="text-white/20 text-xs mt-3">
            ShieldPay does not hold client funds · CBK-compliant · Data protected under Kenya DPA 2019
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-start justify-center px-4 sm:px-6 py-8 sm:py-12 bg-slate-50 overflow-y-auto min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-black text-slate-900 text-lg">ShieldPay</span>
          </Link>

          {/* Mode tabs */}
          <div className="flex bg-white rounded-2xl border border-slate-200 p-1 mb-6 shadow-sm">
            {(["login","register"] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setStep(1); }}
                className={clsx("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                  mode === m ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            {/* Register — step indicator */}
            {mode === "register" && (
              <div className="px-6 pt-5 pb-0">
                <div className="flex gap-2 mb-5">
                  {[1,2].map(n => (
                    <div key={n} className={clsx(
                      "flex-1 h-1.5 rounded-full transition-all",
                      step >= n ? "bg-primary" : "bg-slate-100"
                    )} />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Step {step} of 2
                </p>
                <p className="font-bold text-slate-800 mb-4">
                  {step === 1 ? "Your account details" : "Your business details (KYC)"}
                </p>
                {step === 1 && (
                  <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                    <CheckCircle2 size={15} className="text-green-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800 font-medium">
                      30-day free trial · Full access · No credit card required
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="px-6 pb-6 pt-4 space-y-4">

              {/* ── LOGIN ── */}
              {mode === "login" && (
                <>
                  <div className="field">
                    <label className="label">Email address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input pl-10" type="email" placeholder="you@company.com"
                        value={f.email} onChange={e => set("email", e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleLogin()} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input pl-10 pr-12" type={showPass ? "text" : "password"}
                        placeholder="••••••••" value={f.password}
                        onChange={e => set("password", e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleLogin()} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── REGISTER STEP 1: Account ── */}
              {mode === "register" && step === 1 && (
                <>
                  <div className="field">
                    <label className="label">Full name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input pl-10" placeholder="Jane Mwangi"
                        value={f.full_name} onChange={e => set("full_name", e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Email address *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input pl-10" type="email" placeholder="you@company.com"
                        value={f.email} onChange={e => set("email", e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Phone number *</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input pl-10" type="tel" placeholder="0712 345 678"
                        value={f.phone} onChange={e => set("phone", e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Create a password *</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input pl-10 pr-12" type={showPass ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        value={f.password} onChange={e => set("password", e.target.value)} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── REGISTER STEP 2: Business KYC ── */}
              {mode === "register" && step === 2 && (
                <>
                  <div className="field">
                    <label className="label">Business name *</label>
                    <div className="relative">
                      <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input pl-10" placeholder="Karura Bistro Ltd"
                        value={f.business_name} onChange={e => set("business_name", e.target.value)} />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Type of business *</label>
                    <select className="select" value={f.industry}
                      onChange={e => { set("industry", e.target.value); if (e.target.value !== "Other") set("industry_custom", ""); }}>
                      <option value="">Select your business type…</option>
                      {COMMON_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    {f.industry === "Other" && (
                      <input className="input mt-2" placeholder="Type your business type…"
                        value={f.industry_custom} onChange={e => set("industry_custom", e.target.value)} />
                    )}
                  </div>

                  <div className="field">
                    <label className="label">KRA PIN *</label>
                    <input className="input font-mono uppercase tracking-widest" placeholder="A012345678Z"
                      maxLength={11} value={f.kra_pin}
                      onChange={e => set("kra_pin", e.target.value.toUpperCase())} />
                    <p className="field-hint">Required for KRA & eTIMS compliance</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="field">
                      <label className="label">Business reg. no.</label>
                      <input className="input font-mono text-sm" placeholder="CPR/2024/001"
                        value={f.registration_no} onChange={e => set("registration_no", e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="label">County</label>
                      <select className="select text-sm" value={f.county} onChange={e => set("county", e.target.value)}>
                        <option value="">Select…</option>
                        {["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Nyeri","Machakos","Kisii","Meru","Kakamega","Other"].map(c =>
                          <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Contact person</label>
                    <input className="input" placeholder="Finance Manager or Owner"
                      value={f.contact_person} onChange={e => set("contact_person", e.target.value)} />
                  </div>

                  {/* Terms acceptance */}
                  <div className={clsx(
                    "rounded-2xl p-4 border-2 transition-all",
                    f.terms_accepted ? "border-primary bg-primary/5" : "border-slate-200 bg-slate-50"
                  )}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={f.terms_accepted}
                        onChange={e => set("terms_accepted", e.target.checked)}
                        className="mt-1 w-4 h-4 rounded accent-primary shrink-0" />
                      <span className="text-sm text-slate-700 leading-relaxed">
                        I have read and agree to ShieldPay's{" "}
                        <button type="button" onClick={() => setShowTerms(true)}
                          className="text-primary font-semibold underline hover:no-underline">
                          Terms of Service & Privacy Policy
                        </button>
                        . I understand that ShieldPay does not hold client funds and operates through licensed payment processors (KCB Buni & Stanbic PesaLink).
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              {/* Action buttons */}
              {mode === "login" && (
                <button onClick={handleLogin} disabled={loading}
                  className="btn-primary w-full py-3.5 text-base">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : "Sign In"}
                </button>
              )}

              {mode === "register" && step === 1 && (
                <button onClick={() => { if (validateStep1()) { setError(""); setStep(2); } }}
                  className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2">
                  Continue → Business details
                </button>
              )}

              {mode === "register" && step === 2 && (
                <div className="flex gap-3">
                  <button onClick={() => { setStep(1); setError(""); }}
                    className="btn-secondary px-5 py-3.5">← Back</button>
                  <button onClick={handleRegister} disabled={loading}
                    className="btn-primary flex-1 py-3.5">
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                      : "🚀 Start Free Trial"}
                  </button>
                </div>
              )}

              <p className="text-center text-sm text-slate-400">
                {mode === "login"
                  ? <>No account?{" "}<button onClick={() => { setMode("register"); setError(""); setStep(1); }} className="text-primary font-semibold hover:underline">Start free trial</button></>
                  : <>Have an account?{" "}<button onClick={() => { setMode("login"); setError(""); }} className="text-primary font-semibold hover:underline">Sign in</button></>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
