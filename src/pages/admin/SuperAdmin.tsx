import React, { useState, useEffect, useCallback } from "react";
import {
  Shield, Building2, Users, CheckCircle2, XCircle, RefreshCw,
  LogOut, MessageSquare, Phone, Mail, Send, CreditCard,
  AlertTriangle, Zap, ChevronRight, Plus, Trash2,
  Loader2, Activity, Plug, Search, BarChart3, Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PLANS, INDUSTRY_CONFIG, ROLE_CONFIG } from "@/lib/constants";
import { fmtKES, clsx } from "@/lib/utils";
import { format } from "date-fns";

const COMMS_URL    = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comms`;
const PAYMENTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payments`;
const ADMIN_WA     = "254715800397"; // WhatsApp Business number

type Tab = "dashboard" | "payments" | "businesses" | "comms" | "admins";

// ─── Toast ────────────────────────────────────────────────────
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={clsx(
      "fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2.5 whitespace-nowrap",
      ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
    )}>
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {msg}
    </div>
  );
}

// ─── WhatsApp deep link helper ─────────────────────────────────
function waLink(phone: string, message: string): string {
  const clean = phone.replace(/^0/, "254").replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

// ─── Dashboard Tab ────────────────────────────────────────────
function DashboardTab({ stats, businesses, onTabChange }: {
  stats: any; businesses: any[]; onTabChange: (t: Tab) => void;
}) {
  const CARDS = [
    { label: "Total businesses", value: stats.total,     icon: Building2,  color: "text-blue-400",  bg: "bg-blue-900/20 border-blue-800"  },
    { label: "Active",           value: stats.active,    icon: CheckCircle2,color:"text-green-400", bg: "bg-green-900/20 border-green-800"},
    { label: "On trial",         value: stats.trial,     icon: AlertTriangle,color:"text-amber-400",bg: "bg-amber-900/20 border-amber-800"},
    { label: "Payments pending", value: stats.pending,   icon: Zap,         color:"text-primary",   bg: "bg-primary/20 border-primary/30" },
    { label: "MRR",              value: fmtKES(stats.mrr),icon:BarChart3,   color:"text-purple-400",bg: "bg-purple-900/20 border-purple-800"},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white">
          Good {new Date().getHours() < 12 ? "morning" : "afternoon"} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">{format(new Date(), "EEEE, d MMMM yyyy")} · Nairobi EAT</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {CARDS.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={clsx("rounded-2xl p-4 border", c.bg)}>
              <Icon size={16} className={clsx("mb-2", c.color)} />
              <p className={clsx("text-2xl font-black", c.color)}>{c.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium leading-tight">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick action cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <button onClick={() => onTabChange("payments")}
          className="bg-primary/10 border border-primary/30 rounded-2xl p-5 text-left hover:bg-primary/20 transition-all group">
          <Zap size={22} className="text-primary mb-3" />
          <p className="font-bold text-white">Execute Payments</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {stats.pending} payment{stats.pending !== 1 ? "s" : ""} waiting. Approve and fire via M-Pesa or PesaLink.
          </p>
          <div className="flex items-center gap-1 text-primary text-xs font-bold mt-3">
            Go to queue <ChevronRight size={13} />
          </div>
        </button>

        <button onClick={() => onTabChange("comms")}
          className="bg-green-900/20 border border-green-800 rounded-2xl p-5 text-left hover:bg-green-900/30 transition-all group">
          <MessageSquare size={22} className="text-green-400 mb-3" />
          <p className="font-bold text-white">Message Clients</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Send SMS, WhatsApp or email to one business or all of them.
          </p>
          <div className="flex items-center gap-1 text-green-400 text-xs font-bold mt-3">
            Open comms <ChevronRight size={13} />
          </div>
        </button>

        <button onClick={() => onTabChange("businesses")}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-left hover:bg-slate-700 transition-all group">
          <Building2 size={22} className="text-slate-300 mb-3" />
          <p className="font-bold text-white">All Businesses</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {stats.total} businesses. Manage, activate subscriptions, add team members.
          </p>
          <div className="flex items-center gap-1 text-slate-300 text-xs font-bold mt-3">
            View all <ChevronRight size={13} />
          </div>
        </button>
      </div>

      {/* Recent signups */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="font-bold text-white">Recent signups</h3>
        </div>
        {businesses.slice(0, 6).map(b => (
          <div key={b.id} className="px-5 py-3.5 flex items-center gap-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
            <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-black text-sm shrink-0">
              {b.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{b.name}</p>
              <p className="text-xs text-slate-500 truncate">{b.email} · {b.industry}</p>
            </div>
            <span className={clsx("text-xs px-2.5 py-1 rounded-full font-bold shrink-0",
              b.status === "active" ? "bg-green-900/40 text-green-400" :
              b.status === "trial"  ? "bg-amber-900/40 text-amber-400" : "bg-red-900/40 text-red-400")}>
              {b.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Payment Execution Queue ──────────────────────────────────
function PaymentsTab({ businesses, showToast }: { businesses: any[]; showToast: (m: string, ok?: boolean) => void }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"approved"|"pending_approval"|"failed"|"all">("approved");
  const [executing, setExecuting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("payment_requests")
      .select("*, supplier:suppliers(name,type,paybill_number,till_number,phone_number,bank_account,bank_name,account_number), business:businesses(name,phone,email)")
      .order("due_date", { ascending: true })
      .limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setPayments(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const execute = async (paymentId: string) => {
    setExecuting(paymentId);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(PAYMENTS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "execute", payment_request_id: paymentId }),
    });
    const result = await res.json();
    if (result.success) {
      showToast("✅ Payment fired successfully!");
      setPayments(p => p.map(x => x.id === paymentId ? { ...x, status: "executing" } : x));
    } else {
      showToast(`❌ ${result.error ?? "Failed"}`, false);
      setPayments(p => p.map(x => x.id === paymentId ? { ...x, status: "failed" } : x));
    }
    setExecuting(null);
  };

  const approveAndExecute = async (p: any) => {
    if (!confirm(`Pay ${fmtKES(p.amount)} to ${(p.supplier as any)?.name}?\n\nThis fires the real ${p.payment_method === "pesalink" ? "PesaLink bank transfer" : "M-Pesa"} API now.`)) return;
    await supabase.from("payment_requests").update({ status: "approved" }).eq("id", p.id);
    setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "approved" } : x));
    await execute(p.id);
  };

  const approveOnly = async (id: string) => {
    await supabase.from("payment_requests").update({ status: "approved" }).eq("id", id);
    setPayments(p => p.map(x => x.id === id ? { ...x, status: "approved" } : x));
    showToast("✅ Approved — click Execute when ready");
  };

  const cancel = async (id: string) => {
    if (!confirm("Cancel this payment?")) return;
    await supabase.from("payment_requests").update({ status: "cancelled" }).eq("id", id);
    setPayments(p => p.filter(x => x.id !== id));
    showToast("Payment cancelled");
  };

  const retryFailed = async (p: any) => {
    await supabase.from("payment_requests").update({ status: "approved" }).eq("id", p.id);
    setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "approved" } : x));
    await execute(p.id);
  };

  const methodInfo = (m: string) => ({
    "kcb_paybill": { icon: "📱", label: "M-Pesa Paybill", api: "KCB Buni B2B" },
    "kcb_till":    { icon: "🏪", label: "M-Pesa Till",    api: "KCB Buni B2B" },
    "kcb_mobile":  { icon: "📲", label: "M-Pesa Send",    api: "KCB Buni B2C" },
    "pesalink":    { icon: "🏦", label: "PesaLink",        api: "Stanbic PesaLink" },
  }[m] ?? { icon: "💳", label: m, api: "API" });

  const accountOf = (p: any) => {
    if (p.account_ref) return p.account_ref;
    const s = p.supplier as any;
    return s?.paybill_number ?? s?.till_number ?? s?.phone_number ?? s?.bank_account ?? "—";
  };

  const FILTERS = [
    { key: "approved"          as const, label: "Ready to Pay",    color: "text-primary",   activeBg: "bg-primary/20 border-primary/40" },
    { key: "pending_approval"  as const, label: "Needs Approval",  color: "text-amber-400", activeBg: "bg-amber-900/20 border-amber-700" },
    { key: "failed"            as const, label: "Failed",          color: "text-red-400",   activeBg: "bg-red-900/20 border-red-700" },
    { key: "all"               as const, label: "All",             color: "text-slate-300", activeBg: "bg-slate-700 border-slate-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-white">Payment Queue</h2>
          <p className="text-sm text-slate-400 mt-0.5">Approve and fire real payments via M-Pesa or PesaLink</p>
        </div>
        <button onClick={load} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={clsx(
              "px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
              filter === f.key ? f.activeBg + " " + f.color : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Payment cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse">
              <div className="h-14 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-bold text-white">Queue is empty</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === "approved" ? "No approved payments waiting to execute" : "Nothing here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => {
            const sup    = p.supplier as any;
            const biz    = p.business as any;
            const m      = methodInfo(p.payment_method);
            const acct   = accountOf(p);
            const isExec = executing === p.id;
            const over   = new Date(p.due_date) < new Date();

            return (
              <div key={p.id} className={clsx(
                "bg-slate-900 border rounded-2xl overflow-hidden",
                over ? "border-red-800" : "border-slate-800"
              )}>
                {/* Card top */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Method icon */}
                    <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      {m.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-white truncate">{p.title}</p>
                            {over && <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-800 px-1.5 py-0.5 rounded-full font-bold">OVERDUE</span>}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{biz?.name}</p>
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-white shrink-0">{fmtKES(p.amount)}</p>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {[
                          { label: "Pay to",    value: sup?.name ?? "—" },
                          { label: "Via",       value: `${m.label}`, sub: m.api },
                          { label: "Account",   value: acct, mono: true },
                          { label: "Due",       value: format(new Date(p.due_date), "dd MMM yyyy"), urgent: over },
                        ].map(info => (
                          <div key={info.label} className="bg-slate-800/80 rounded-xl px-2.5 sm:px-3 py-2">
                            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold">{info.label}</p>
                            <p className={clsx("text-xs sm:text-sm font-semibold truncate mt-0.5",
                              info.urgent ? "text-red-400" : "text-white",
                              info.mono ? "font-mono" : "")}>
                              {info.value}
                            </p>
                            {info.sub && <p className="text-[9px] text-slate-600">{info.sub}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="px-4 sm:px-5 pb-4 flex items-center gap-2 flex-wrap">
                  <span className={clsx("text-xs px-2.5 py-1 rounded-full font-bold",
                    p.status === "approved"         ? "bg-blue-900/40 text-blue-300" :
                    p.status === "pending_approval" ? "bg-amber-900/40 text-amber-400" :
                    p.status === "executing"        ? "bg-purple-900/40 text-purple-400 animate-pulse" :
                    p.status === "failed"           ? "bg-red-900/40 text-red-400" :
                    "bg-slate-700 text-slate-300")}>
                    {p.status === "executing" ? "⚡ Executing…" : p.status.replace(/_/g, " ")}
                  </span>

                  <div className="flex-1" />

                  {/* pending_approval → approve+execute or approve only */}
                  {p.status === "pending_approval" && (
                    <>
                      <button onClick={() => approveAndExecute(p)} disabled={isExec}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm font-bold px-3 sm:px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-green-900/30">
                        {isExec ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                        <span className="hidden sm:inline">Approve &amp;</span> Execute
                      </button>
                      <button onClick={() => approveOnly(p.id)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl border border-slate-700 transition-all">
                        <CheckCircle2 size={13} /> Approve
                      </button>
                    </>
                  )}

                  {/* approved → execute now */}
                  {p.status === "approved" && (
                    <button onClick={() => execute(p.id)} disabled={isExec}
                      className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold px-3 sm:px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary/20">
                      {isExec
                        ? <><Loader2 size={13} className="animate-spin" /> Executing…</>
                        : <><Zap size={13} /> Pay via {p.payment_method === "pesalink" ? "PesaLink" : "M-Pesa"}</>}
                    </button>
                  )}

                  {/* failed → retry */}
                  {p.status === "failed" && (
                    <button onClick={() => retryFailed(p)} disabled={isExec}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2.5 rounded-xl transition-all disabled:opacity-50">
                      {isExec ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                      Retry
                    </button>
                  )}

                  {/* Cancel */}
                  {!["completed","cancelled","executing"].includes(p.status) && (
                    <button onClick={() => cancel(p.id)} title="Cancel"
                      className="p-2 rounded-xl hover:bg-red-900/30 text-slate-600 hover:text-red-400 transition-all">
                      <XCircle size={15} />
                    </button>
                  )}

                  {/* Completed info */}
                  {p.status === "completed" && (
                    <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
                      <CheckCircle2 size={13} />
                      Done {p.completed_at ? format(new Date(p.completed_at), "dd MMM HH:mm") : ""}
                      {(p.mpesa_receipt || p.bank_reference) && (
                        <span className="font-mono bg-green-900/20 px-2 py-0.5 rounded-lg">
                          {p.mpesa_receipt ?? p.bank_reference}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Failure reason */}
                {p.status === "failed" && p.failure_reason && (
                  <div className="mx-4 sm:mx-5 mb-4 px-3 py-2 bg-red-900/20 border border-red-800/50 rounded-xl">
                    <p className="text-xs text-red-400">❌ {p.failure_reason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Businesses Tab ───────────────────────────────────────────
function BusinessesTab({ businesses, showToast, onRefresh }: {
  businesses: any[]; showToast: (m: string, ok?: boolean) => void; onRefresh: () => void;
}) {
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (b.phone ?? "").includes(search)
  );

  const activateSub = async (b: any) => {
    const ref  = prompt(`Payment ref for ${b.name} (M-Pesa or bank ref):`);
    if (!ref) return;
    const plan = prompt("Plan (starter/growth/enterprise):", "growth") ?? "growth";
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${COMMS_URL}/subscribe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: b.id, plan, paymentRef: ref, amount: plan === "growth" ? 2999 : 1499, months: 1 }),
    });
    const result = await res.json();
    if (result.ok) { showToast("✅ Subscription activated! SMS + email sent."); onRefresh(); }
    else showToast(result.error ?? "Failed", false);
  };

  const toggleStatus = async (b: any) => {
    const ns = b.status === "suspended" ? "active" : "suspended";
    if (!confirm(`${ns === "suspended" ? "Suspend" : "Activate"} ${b.name}?`)) return;
    await supabase.from("businesses").update({ status: ns }).eq("id", b.id);
    showToast(`${b.name} is now ${ns}`);
    onRefresh();
  };

  const sendWhatsApp = (b: any, msg?: string) => {
    const phone = b.phone ?? "";
    if (!phone) { showToast("No phone number for this business", false); return; }
    const message = msg ?? `Hi ${b.name}, this is ShieldPay. Your bill automation is ready. Let us know if you need any help!`;
    window.open(waLink(phone, message), "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-black text-white">Businesses ({businesses.length})</h2>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 w-56 sm:w-72"
            placeholder="Search name, email, phone…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(b => (
          <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Business row */}
            <div className="p-4 flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-black shrink-0">
                {b.name[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{b.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {b.email}{b.phone ? ` · ${b.phone}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx("text-xs px-2.5 py-1 rounded-full font-bold",
                  b.status === "active" ? "bg-green-900/40 text-green-400" :
                  b.status === "trial"  ? "bg-amber-900/40 text-amber-400" : "bg-red-900/40 text-red-400")}>
                  {b.status}
                </span>
                <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400 font-medium capitalize">
                  {b.plan}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* WhatsApp — opens your WhatsApp Business with a pre-filled message */}
                <button
                  onClick={() => sendWhatsApp(b)}
                  title="WhatsApp this client"
                  className="w-8 h-8 rounded-xl bg-green-900/30 hover:bg-green-900/50 text-green-400 flex items-center justify-center transition-all text-sm font-bold">
                  💬
                </button>

                <button onClick={() => activateSub(b)}
                  title="Activate subscription"
                  className="w-8 h-8 rounded-xl bg-primary/20 hover:bg-primary/40 text-primary flex items-center justify-center transition-all">
                  <CreditCard size={13} />
                </button>

                <button onClick={() => setSelected(selected?.id === b.id ? null : b)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all text-xs font-bold">
                  {selected?.id === b.id ? "▲" : "▼"}
                </button>

                <button onClick={() => toggleStatus(b)}
                  title={b.status === "suspended" ? "Activate" : "Suspend"}
                  className="w-8 h-8 rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-400 flex items-center justify-center transition-all">
                  {b.status === "suspended" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {selected?.id === b.id && (
              <div className="border-t border-slate-800 px-4 py-4 bg-slate-950/50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Industry",  value: (INDUSTRY_CONFIG as any)[b.industry]?.label ?? b.industry },
                    { label: "KRA PIN",   value: b.kra_pin || "Not set" },
                    { label: "County",    value: b.county || "Not set" },
                    { label: "Joined",    value: format(new Date(b.created_at), "dd MMM yyyy") },
                  ].map(r => (
                    <div key={r.label} className="bg-slate-800 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{r.label}</p>
                      <p className="text-sm text-white font-semibold mt-0.5">{r.value}</p>
                    </div>
                  ))}
                </div>

                {/* Quick message templates */}
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-2">Quick WhatsApp messages</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "Trial reminder",     msg: `Hi ${b.name} 👋 Your ShieldPay free trial ends soon. Reply to subscribe and keep your bill automations running!` },
                      { label: "Payment reminder",   msg: `Hi ${b.name}, you have a bill payment due soon on ShieldPay. Log in to approve it before the due date.` },
                      { label: "Welcome message",    msg: `Welcome to ShieldPay, ${b.name}! 🎉 Your account is ready. Log in and schedule your first bill — takes 2 minutes.` },
                    ].map(t => (
                      <button key={t.label}
                        onClick={() => sendWhatsApp(b, t.msg)}
                        className="text-xs bg-green-900/20 text-green-400 border border-green-800 px-3 py-1.5 rounded-xl hover:bg-green-900/40 transition-all font-medium flex items-center gap-1.5">
                        💬 {t.label}
                      </button>
                    ))}
                    <button onClick={() => {
                      const custom = prompt("Custom message:");
                      if (custom) sendWhatsApp(b, custom);
                    }} className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-700 transition-all font-medium">
                      ✏️ Custom
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <p className="text-slate-400">No businesses found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Comms Tab ────────────────────────────────────────────────
function CommsTab({ businesses, showToast }: { businesses: any[]; showToast: (m: string, ok?: boolean) => void }) {
  const [channel, setChannel]   = useState("sms");
  const [audience, setAudience] = useState("trial");
  const [message, setMessage]   = useState("");
  const [sending, setSending]   = useState(false);
  const [logs, setLogs]         = useState<any[]>([]);

  useEffect(() => {
    supabase.from("comms_log").select("*").order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => setLogs(data ?? []));
  }, []);

  const sendBulk = async () => {
    if (!message.trim()) { showToast("Write a message first", false); return; }
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${COMMS_URL}/bulk`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel, filter: audience, template: "custom", message }),
    });
    const result = await res.json();
    if (result.ok) showToast(`✅ Sent ${result.sent} · Failed ${result.failed}`);
    else showToast(result.error ?? "Failed", false);
    setSending(false);
    setMessage("");
  };

  const audienceCount = {
    trial:    businesses.filter(b => b.status === "trial").length,
    active:   businesses.filter(b => b.status === "active").length,
    all:      businesses.length,
  }[audience] ?? businesses.length;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-black text-white">Communications</h2>

      {/* Bulk send panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <p className="font-bold text-white flex items-center gap-2">
          <Send size={16} className="text-primary" /> Send to multiple businesses
        </p>

        {/* Channel */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "sms",       icon: "📱", label: "SMS" },
            { key: "whatsapp",  icon: "💬", label: "WhatsApp" },
            { key: "email",     icon: "📧", label: "Email" },
          ].map(c => (
            <button key={c.key} onClick={() => setChannel(c.key)}
              className={clsx(
                "flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all",
                channel === c.key ? "bg-primary border-primary text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              )}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Audience */}
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase mb-2">Who to send to</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "trial",  label: "Trial users",       count: businesses.filter(b=>b.status==="trial").length },
              { key: "active", label: "Active subscribers",count: businesses.filter(b=>b.status==="active").length },
              { key: "all",    label: "Everyone",          count: businesses.length },
            ].map(a => (
              <button key={a.key} onClick={() => setAudience(a.key)}
                className={clsx(
                  "py-2.5 px-3 rounded-xl border text-xs font-semibold text-left transition-all",
                  audience === a.key ? "bg-slate-700 border-slate-500 text-white" : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                )}>
                <p>{a.label}</p>
                <p className={clsx("font-black text-base mt-0.5", audience === a.key ? "text-primary" : "text-slate-400")}>
                  {a.count}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 font-bold uppercase">Message</p>
            <p className="text-xs text-slate-500">{message.length} chars</p>
          </div>
          {/* Quick templates */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {[
              { label: "Trial expiring", text: "Hi! Your ShieldPay free trial is ending soon. Subscribe to keep your bill automations running. Reply for help!" },
              { label: "Welcome",        text: "Welcome to ShieldPay! 🎉 Log in and schedule your first bill — it takes 2 minutes. We're here if you need help." },
            ].map(t => (
              <button key={t.label} onClick={() => setMessage(t.text)}
                className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-700 transition-all">
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Type your message…"
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <button onClick={sendBulk} disabled={sending || !message.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {sending ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={15} /> Send to {audienceCount} businesses</>}
        </button>
      </div>

      {/* Comms log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <p className="font-bold text-white">Recent messages sent</p>
        </div>
        {logs.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No messages sent yet</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {logs.map(l => (
              <div key={l.id} className="px-5 py-3.5 flex items-start gap-3">
                <span className="text-base mt-0.5 shrink-0">
                  {l.channel === "sms" ? "📱" : l.channel === "whatsapp" ? "💬" : "📧"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{l.message}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l.recipient} · {l.channel}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium",
                    l.status === "sent" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400")}>
                    {l.status}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{format(new Date(l.created_at), "dd MMM HH:mm")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admins Tab ───────────────────────────────────────────────
function AdminsTab({ currentUser, showToast }: { currentUser: any; showToast: (m: string, ok?: boolean) => void }) {
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("admin_admins").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setAdmins(data ?? []));
  }, []);

  const add = async () => {
    const email = prompt("New admin email:");
    if (!email) return;
    const name  = prompt("Their name:") ?? "";
    const role  = prompt("Role (admin/support):", "admin") ?? "admin";
    const { error } = await supabase.from("admin_admins").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      email: email.trim(), full_name: name, role, is_active: true,
      added_by: currentUser?.id,
    });
    if (error) { showToast(error.message, false); return; }
    setAdmins(p => [...p, { email: email.trim(), full_name: name, role, is_active: true }]);
    showToast(`✅ ${email} added as ${role}`);
  };

  const disable = async (id: string, email: string) => {
    if (!confirm(`Disable ${email}?`)) return;
    await supabase.from("admin_admins").update({ is_active: false }).eq("id", id);
    setAdmins(p => p.map(a => a.id === id ? { ...a, is_active: false } : a));
    showToast("Admin disabled");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Admin Users</h2>
        <button onClick={add} className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all">
          <Plus size={14} /> Add Admin
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* You — always shown */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-black text-sm">
            {currentUser?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{currentUser?.email}</p>
            <p className="text-xs text-slate-400">Super Admin · You</p>
          </div>
          <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full font-bold">owner</span>
        </div>

        {admins.filter(a => a.email !== currentUser?.email).map(a => (
          <div key={a.id} className="px-5 py-4 flex items-center gap-3 border-b border-slate-800 last:border-0">
            <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 font-black text-sm">
              {(a.full_name || a.email)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{a.full_name || a.email}</p>
              {a.full_name && <p className="text-xs text-slate-400 truncate">{a.email}</p>}
            </div>
            <span className={clsx("text-xs px-2.5 py-1 rounded-full font-bold",
              a.role === "admin" ? "bg-blue-900/40 text-blue-400" : "bg-slate-700 text-slate-300")}>
              {a.role}
            </span>
            <span className={clsx("text-xs px-2 py-1 rounded-lg",
              a.is_active ? "bg-green-900/40 text-green-400" : "bg-slate-800 text-slate-500")}>
              {a.is_active ? "active" : "disabled"}
            </span>
            {a.is_active && (
              <button onClick={() => disable(a.id, a.email)}
                className="text-red-400 hover:text-red-300 p-1.5 transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}

        {admins.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-slate-500 text-sm">No other admins yet. Add your team.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main SuperAdmin ──────────────────────────────────────────
export default function SuperAdmin() {
  const { user, signOut } = useAuth();
  const [tab, setTab]       = useState<Tab>("dashboard");
  const [businesses, setBiz] = useState<any[]>([]);
  const [stats, setStats]   = useState({ total: 0, active: 0, trial: 0, pending: 0, mrr: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [bizRes, pendingRes] = await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: false }),
      supabase.from("payment_requests").select("id", { count: "exact", head: true })
        .in("status", ["pending_approval", "approved"]),
    ]);

    const biz = bizRes.data ?? [];
    const pending = (pendingRes as any).count ?? 0;
    const active = biz.filter(b => b.status === "active");
    const mrr    = active.reduce((s: number, b: any) => s + (PLANS[b.plan as keyof typeof PLANS]?.price || 0), 0);

    // Member counts
    const counts = await Promise.all(biz.map(b =>
      supabase.from("business_members").select("id", { count: "exact", head: true })
        .eq("business_id", b.id).eq("status", "active")
        .then(({ count }) => ({ id: b.id, count: count || 0 }))
    ));
    const cMap = Object.fromEntries(counts.map(x => [x.id, x.count]));
    setBiz(biz.map(b => ({ ...b, member_count: cMap[b.id] || 0 })));
    setStats({
      total:   biz.length,
      active:  active.length,
      trial:   biz.filter(b => b.status === "trial").length,
      pending,
      mrr,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const TABS = [
    { id: "dashboard"   as Tab, label: "Dashboard",  icon: BarChart3,      badge: 0 },
    { id: "payments"    as Tab, label: "Payments",   icon: Zap,            badge: stats.pending },
    { id: "businesses"  as Tab, label: "Businesses", icon: Building2,      badge: 0 },
    { id: "comms"       as Tab, label: "Messages",   icon: MessageSquare,  badge: 0 },
    { id: "admins"      as Tab, label: "Admins",     icon: Shield,         badge: 0 },
  ];

  const Sidebar = ({ mobile = false }) => (
    <div className={clsx(
      "flex flex-col h-full",
      mobile ? "w-64" : "w-52 lg:w-56"
    )}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm">ShieldPay</p>
            <p className="text-[9px] text-primary font-bold uppercase tracking-widest">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => { setTab(t.id); setSidebarOpen(false); }}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
              tab === t.id ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}>
            <t.icon size={15} className="shrink-0" />
            <span className="flex-1">{t.label}</span>
            {t.badge > 0 && (
              <span className={clsx(
                "text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                tab === t.id ? "bg-white/25 text-white" : "bg-red-500 text-white"
              )}>
                {t.badge > 99 ? "99+" : t.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-2">
        <p className="text-xs text-slate-500 truncate px-3">{user?.email}</p>
        <div className="flex gap-2">
          <button onClick={load} className="flex-1 text-xs bg-slate-800 text-slate-300 py-2 rounded-xl hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors">
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={signOut} className="flex-1 text-xs bg-red-900/30 text-red-400 py-2 rounded-xl hover:bg-red-900/50 flex items-center justify-center gap-1 transition-colors">
            <LogOut size={11} /> Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {toast && <Toast {...toast} />}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex bg-slate-900 border-r border-slate-800 sticky top-0 h-screen shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="bg-slate-900 border-l border-slate-800 h-full overflow-y-auto">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 h-14 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Shield size={13} className="text-white" />
            </div>
            <span className="font-black text-white text-sm">ShieldPay Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {stats.pending > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {stats.pending} pending
              </span>
            )}
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400">
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {tab === "dashboard"  && <DashboardTab  stats={stats} businesses={businesses} onTabChange={setTab} />}
          {tab === "payments"   && <PaymentsTab   businesses={businesses} showToast={showToast} />}
          {tab === "businesses" && <BusinessesTab businesses={businesses} showToast={showToast} onRefresh={load} />}
          {tab === "comms"      && <CommsTab      businesses={businesses} showToast={showToast} />}
          {tab === "admins"     && <AdminsTab     currentUser={user}     showToast={showToast} />}
        </main>
      </div>
    </div>
  );
}

