import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield, ArrowRight, CheckCircle2, Star, Menu, X,
  Zap, Lock, BarChart3, Users, Bell, Globe,
  Building2, Truck, ShoppingBag, Stethoscope,
  GraduationCap, Home, ChevronDown,
} from "lucide-react";

// ─── Nav ──────────────────────────────────────────────────────
const NAV = [
  { label: "How it works", href: "#how" },
  { label: "Who it's for", href: "#who" },
  { label: "Features",     href: "#features" },
];

// ─── Stats ────────────────────────────────────────────────────
const STATS = [
  { value: "0%",   label: "Bill miss rate",    sub: "once you're set up"          },
  { value: "6hrs", label: "Saved weekly",       sub: "per business on average"     },
  { value: "2min", label: "To schedule a bill", sub: "first one takes 2 minutes"   },
  { value: "30",   label: "Day free trial",     sub: "no credit card needed"       },
];

// ─── How it works ─────────────────────────────────────────────
const STEPS = [
  {
    n: "01", emoji: "➕",
    title: "Add who you pay",
    desc: "Add any company or person you pay regularly. KPLC, your landlord, fuel supplier, insurance company. Takes 30 seconds each. You only do this once.",
  },
  {
    n: "02", emoji: "📅",
    title: "Set when to pay",
    desc: "Tell ShieldPay the amount and how often — weekly, monthly, once. It tracks every due date automatically and reminds you 3 days before.",
  },
  {
    n: "03", emoji: "✅",
    title: "Approve in one tap",
    desc: "When the day comes, you or your team gets a notification. One tap approves it. ShieldPay pays via M-Pesa or bank transfer instantly.",
  },
  {
    n: "04", emoji: "🧾",
    title: "Receipt saved forever",
    desc: "Every payment generates a receipt automatically — supplier, amount, date, reference. Ready for your accountant or KRA anytime.",
  },
];

// ─── Who it's for ─────────────────────────────────────────────
const WHO = [
  {
    icon: Building2, label: "Restaurants",
    bills: ["KPLC / Kenya Power", "Gas & LPG supplier", "Food & produce", "Rent", "NHIF & NSSF"],
    color: "text-orange-500", bg: "bg-orange-50 border-orange-100",
  },
  {
    icon: Truck, label: "Logistics & Transport",
    bills: ["Fuel depot", "Vehicle insurance", "NTSA licensing", "Driver payroll", "Maintenance"],
    color: "text-blue-500", bg: "bg-blue-50 border-blue-100",
  },
  {
    icon: ShoppingBag, label: "Retail & Wholesale",
    bills: ["Stock suppliers", "Rent & utilities", "KPLC", "Loan repayments", "Staff wages"],
    color: "text-purple-500", bg: "bg-purple-50 border-purple-100",
  },
  {
    icon: Stethoscope, label: "Clinics & Pharmacies",
    bills: ["Medical suppliers", "NHIF", "Rent", "Staff payroll", "Equipment leases"],
    color: "text-red-500", bg: "bg-red-50 border-red-100",
  },
  {
    icon: GraduationCap, label: "Schools",
    bills: ["Teacher payroll", "KPLC", "Water", "Suppliers", "KRA & compliance"],
    color: "text-green-500", bg: "bg-green-50 border-green-100",
  },
  {
    icon: Home, label: "Property & Real Estate",
    bills: ["Security companies", "Cleaning services", "KPLC & water", "Maintenance", "KRA"],
    color: "text-amber-500", bg: "bg-amber-50 border-amber-100",
  },
];

// ─── Features ─────────────────────────────────────────────────
const FEATURES = [
  { icon: Zap,          title: "Never miss a payment",    desc: "Every bill is tracked and reminded. You get an alert 3 days before it's due. Nothing falls through the cracks.",      color: "bg-primary/10 text-primary"   },
  { icon: CheckCircle2, title: "Approval before payment", desc: "Every payment is reviewed before it goes out. Your finance team approves, you stay in control of every shilling.",   color: "bg-green-100 text-green-600"  },
  { icon: Globe,        title: "M-Pesa + Bank transfer",  desc: "Pay any paybill, till number, phone number or bank account. M-Pesa via KCB Buni. Bank transfers via PesaLink.",     color: "bg-blue-100 text-blue-600"    },
  { icon: BarChart3,    title: "See where money goes",    desc: "Live view of every bill — paid, upcoming, overdue. Know your cash flow without asking your accountant.",             color: "bg-indigo-100 text-indigo-600" },
  { icon: Lock,         title: "Full audit trail",        desc: "Every payment, approval and action is recorded with who did it and when. Perfect for audits or disputes.",           color: "bg-slate-100 text-slate-600"  },
  { icon: Users,        title: "Team access by role",     desc: "Add your finance manager, approver, or accountant. Each person sees only what they need. You stay in control.",     color: "bg-purple-100 text-purple-600" },
  { icon: Bell,         title: "Smart reminders",         desc: "3-day reminders before every due date. No more waking up realising you forgot to pay the gas supplier.",            color: "bg-orange-100 text-orange-600" },
  { icon: Shield,       title: "Receipts auto-generated", desc: "The moment a payment completes, a receipt is created with all details. Download, share or archive — always there.", color: "bg-rose-100 text-rose-600"    },
];

// ─── Testimonials ─────────────────────────────────────────────
const TESTIMONIALS = [
  { name: "James K.",    role: "Restaurant owner, Nairobi",           stars: 5, quote: "I used to sit every Friday manually sending M-Pesa to 12 different suppliers. Now ShieldPay does it automatically. I haven't missed a single payment in 6 months." },
  { name: "Grace A.",    role: "Logistics director, Mombasa",         stars: 5, quote: "Managing fuel payments for 40 trucks was a nightmare. Now everything is scheduled, approved, and paid automatically. My team actually trusts the system." },
  { name: "David M.",    role: "School bursar, Nakuru",               stars: 5, quote: "NHIF, NSSF, supplier bills — everything was manual. ShieldPay handles all of it. Even the teachers notice their payments are always on time now." },
];

// ─── FAQ ──────────────────────────────────────────────────────
const FAQ = [
  { q: "What kind of businesses use ShieldPay?",         a: "Any business that pays recurring bills — restaurants, logistics companies, schools, clinics, retail shops, property managers. If you pay KPLC, suppliers, rent, insurance, staff, or any regular expense — ShieldPay automates it." },
  { q: "How does the free trial work?",                  a: "Sign up and get 30 days completely free. No credit card required. Full access to everything. After 30 days, contact us to continue." },
  { q: "Which payment methods does ShieldPay support?",  a: "M-Pesa paybill, M-Pesa till numbers, M-Pesa send money (phone to phone), and bank-to-bank PesaLink transfers across all major Kenyan banks." },
  { q: "Can I connect my accounting software?",          a: "Yes. ShieldPay connects with QuickBooks, Zoho Books, and Excel. Bills from your accounting software can be imported automatically." },
  { q: "Is it safe? Who can see my payment data?",       a: "All data is encrypted. Only people you add to your account can see your payments. Every action is logged with who did it and when." },
  { q: "What if I need help setting up?",               a: "Reach us on WhatsApp: 0715 800 397. We help you set up your first bills and make sure everything runs correctly." },
];

// ─── Components ───────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors gap-4">
        <span className="font-semibold text-slate-800 text-sm leading-snug">{q}</span>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Main Landing ─────────────────────────────────────────────
export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight">ShieldPay</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV.map(l => (
              <a key={l.label} href={l.href}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors">
              Sign in
            </Link>
            <Link to="/login"
              className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5">
              Start free <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile burger */}
          <button onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1">
            {NAV.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                {l.label}
              </a>
            ))}
            <div className="pt-3 space-y-2 border-t border-slate-100 mt-3">
              <Link to="/login" className="block text-center py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                Sign in
              </Link>
              <Link to="/login"
                className="block text-center bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">
                Start free — 30 days
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-b from-slate-50 to-white pt-16 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 text-primary text-xs font-bold px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Trusted by businesses across Kenya
          </div>

          {/* Headline — big on desktop, still big on mobile */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
            Stop paying bills<br className="hidden sm:block" />
            <span className="text-primary"> manually.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 px-2">
            ShieldPay automates every bill your business pays — KPLC, rent, fuel, insurance, suppliers.
            Set it up once. Approve with one tap. Never miss a payment again.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 px-4">
            <Link to="/login"
              className="w-full sm:w-auto bg-primary text-white text-base sm:text-lg font-black px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
              Start free — 30 days <ArrowRight size={18} />
            </Link>
            <a href="https://wa.me/254715800397?text=Hi%20ShieldPay%2C%20I%20want%20to%20learn%20more"
              target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto bg-green-600 text-white text-base font-bold px-8 py-4 rounded-2xl hover:bg-green-500 transition-all flex items-center justify-center gap-2">
              💬 WhatsApp us
            </a>
          </div>

          <p className="text-sm text-slate-400">No credit card · No setup fee · Works on phone, tablet or computer</p>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-black text-primary">{s.value}</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Up and running in 5 minutes
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
              Simple enough for anyone. No accounting knowledge needed.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.n} className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm relative">
                <div className="text-3xl sm:text-4xl mb-4">{step.emoji}</div>
                <div className="text-xs font-black text-primary mb-2 tracking-widest">{step.n}</div>
                <h3 className="font-bold text-slate-800 mb-2 sm:mb-3 text-sm sm:text-base">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section id="who" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Who it's for</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Any business that pays bills
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
              If your business makes payments regularly, ShieldPay automates them.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHO.map(w => {
              const Icon = w.icon;
              return (
                <div key={w.label} className={`rounded-2xl p-5 sm:p-6 border ${w.bg}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm ${w.color}`}>
                      <Icon size={18} />
                    </div>
                    <h3 className="font-bold text-slate-800">{w.label}</h3>
                  </div>
                  <div className="space-y-1.5">
                    {w.bills.map(b => (
                      <div key={b} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 size={13} className="text-primary shrink-0" />
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Not in the list? */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't see your industry?{" "}
              <a href="https://wa.me/254715800397?text=Hi%2C%20I%20run%20a%20business%20and%20want%20to%20know%20if%20ShieldPay%20works%20for%20me"
                target="_blank" rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline">
                WhatsApp us — 0715 800 397
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Everything you need. Nothing you don't.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon size={18} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2 text-sm sm:text-base">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Real stories</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Businesses that stopped worrying
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-100">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-5">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Questions</h2>
          </div>
          <div className="space-y-2">
            {FAQ.map(item => <FaqItem key={item.q} {...item} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-4xl sm:text-5xl mb-6">🛡️</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Start today. Free for 30 days.
          </h2>
          <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-xl mx-auto px-2">
            Set up your first bill in 2 minutes. No credit card. No contracts.
            Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
            <Link to="/login"
              className="w-full sm:w-auto bg-white text-primary font-black text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-2xl hover:bg-slate-50 transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-2">
              Get started free <ArrowRight size={18} />
            </Link>
            <a href="https://wa.me/254715800397?text=Hi%20ShieldPay%2C%20I%27d%20like%20to%20get%20started"
              target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto bg-green-500 text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-green-400 transition-all flex items-center justify-center gap-2">
              💬 Chat on WhatsApp
            </a>
          </div>
          <p className="text-white/50 text-sm mt-6">
            Questions? WhatsApp 0715 800 397 · We reply fast.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 px-4 sm:px-6 py-10 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <Shield size={13} className="text-white" />
                </div>
                <span className="font-black text-white">ShieldPay</span>
              </div>
              <p className="text-slate-400 text-sm">Bill automation for Kenyan businesses</p>
              <p className="text-slate-500 text-xs mt-1">Built in Kenya 🇰🇪</p>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <a href="https://wa.me/254715800397"
                target="_blank" rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 text-sm font-semibold transition-colors flex items-center gap-1.5">
                💬 WhatsApp: 0715 800 397
              </a>
              <a href="mailto:risewithdion@gmail.com"
                className="text-slate-400 hover:text-white text-sm transition-colors">
                risewithdion@gmail.com
              </a>
              <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors">
                Sign in
              </Link>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-6 text-center">
            <p className="text-slate-600 text-xs">© {new Date().getFullYear()} ShieldPay. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
