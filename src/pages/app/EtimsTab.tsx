import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Download, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fmtKES, clsx } from "@/lib/utils";
import { format } from "date-fns";

export function EtimsTab() {
  const { business, isAdmin, refetch } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [etims, setEtims] = useState({
    enabled:    business?.etims_enabled ?? false,
    pin:        business?.etims_pin ?? "",
    cu_serial:  business?.etims_cu_serial ?? "",
  });

  useEffect(() => {
    if (!business) return;
    setEtims({
      enabled:   business.etims_enabled ?? false,
      pin:       business.etims_pin ?? "",
      cu_serial: business.etims_cu_serial ?? "",
    });
    supabase.from("etims_submissions")
      .select("*").eq("business_id", business.id)
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { setSubmissions(data ?? []); setLoading(false); });
  }, [business?.id]);

  const save = async () => {
    if (!business) return;
    setSaving(true);
    await supabase.from("businesses").update({
      etims_enabled:   etims.enabled,
      etims_pin:       etims.pin.trim() || null,
      etims_cu_serial: etims.cu_serial.trim() || null,
    }).eq("id", business.id);
    refetch();
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const totalSubmitted = submissions.filter(s => s.status === "submitted" || s.status === "accepted").length;
  const totalAmount    = submissions.reduce((s, x) => s + x.amount, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="section-title mb-0.5">eTIMS Integration</h3>
        <p className="text-sm text-slate-500">
          Connect to KRA's Electronic Tax Invoice Management System. When enabled, ShieldPay automatically
          queues eTIMS invoices for every completed payment.
        </p>
      </div>
      <div className="divider" />

      {/* KRA info card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">KRA Compliance Notice</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              eTIMS is mandatory for VAT-registered businesses in Kenya. ShieldPay helps automate invoice
              submission but you remain responsible for ensuring your KRA PIN and eTIMS credentials are correct.
              <a href="https://etims.kra.go.ke" target="_blank" rel="noopener noreferrer"
                className="font-semibold underline ml-1">Visit KRA eTIMS portal →</a>
            </p>
          </div>
        </div>
      </div>

      {/* eTIMS settings */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">Enable eTIMS auto-submission</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically queue tax invoices when payments complete
            </p>
          </div>
          <button
            onClick={() => setEtims(e => ({ ...e, enabled: !e.enabled }))}
            disabled={!isAdmin}
            className={clsx(
              "relative w-12 h-6 rounded-full transition-all",
              etims.enabled ? "bg-primary" : "bg-slate-200"
            )}>
            <div className={clsx(
              "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all",
              etims.enabled ? "left-7" : "left-1"
            )} />
          </button>
        </div>

        {etims.enabled && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="field">
              <label className="label">eTIMS KRA PIN</label>
              <input className="input font-mono uppercase" placeholder="A012345678Z"
                maxLength={11} value={etims.pin}
                onChange={e => setEtims(v => ({ ...v, pin: e.target.value.toUpperCase() }))}
                disabled={!isAdmin} />
              <p className="field-hint">The KRA PIN registered for eTIMS (usually your business PIN)</p>
            </div>
            <div className="field">
              <label className="label">Control Unit Serial Number (optional)</label>
              <input className="input font-mono" placeholder="CU serial from KRA"
                value={etims.cu_serial}
                onChange={e => setEtims(v => ({ ...v, cu_serial: e.target.value }))}
                disabled={!isAdmin} />
            </div>
          </div>
        )}

        {isAdmin && (
          <button onClick={save} disabled={saving}
            className="btn-primary flex items-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> :
             saved  ? <><CheckCircle2 size={14} />Saved!</> : "Save eTIMS Settings"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total invoices",  value: submissions.length },
          { label: "Submitted",       value: totalSubmitted },
          { label: "Total amount",    value: fmtKES(totalAmount) },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-black text-primary">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Submissions log */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h4 className="font-bold text-slate-800">eTIMS Submissions Log</h4>
          <button onClick={() => {
            if (!business) return;
            supabase.from("etims_submissions").select("*").eq("business_id", business.id)
              .order("created_at", { ascending: false }).limit(50)
              .then(({ data }) => setSubmissions(data ?? []));
          }} className="btn-icon p-1.5"><RefreshCw size={14} /></button>
        </div>
        {loading ? (
          <div className="p-6 text-center"><Loader2 size={20} className="animate-spin text-slate-400 mx-auto" /></div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400 text-sm">No eTIMS submissions yet</p>
            <p className="text-slate-300 text-xs mt-1">Enable eTIMS above and complete a payment to start</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead className="thead">
                <tr>
                  {["Invoice #","Payee","Amount","VAT","Status","Date"].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="tbody">
                {submissions.map(s => (
                  <tr key={s.id} className="tr">
                    <td className="td font-mono text-xs">{s.invoice_number}</td>
                    <td className="td font-medium text-sm">{s.supplier_name}</td>
                    <td className="td font-bold">{fmtKES(s.amount)}</td>
                    <td className="td text-sm text-slate-500">{fmtKES(s.vat_amount)}</td>
                    <td className="td">
                      <span className={clsx("badge",
                        s.status === "accepted"  ? "badge-green" :
                        s.status === "submitted" ? "badge-blue" :
                        s.status === "pending"   ? "badge-amber" :
                        s.status === "rejected"  ? "badge-red" : "badge-slate")}>
                        {s.status}
                      </span>
                    </td>
                    <td className="td text-xs text-slate-500">
                      {format(new Date(s.created_at), "dd MMM yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
