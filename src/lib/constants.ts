import type { PlanKey, MemberRole, PaymentMethod, SupplierType, Frequency, PaymentStatus } from "./types";

// ─── PLANS — Simple. Solo vs Multi-branch ────────────────────
export const PLANS: Record<PlanKey, {
  name: string; price: number | null; badge: string; tagline: string;
  popular: boolean; features: string[];
}> = {
  solo: {
    name: "Solo Branch", price: 1499, badge: "badge-slate",
    tagline: "One location. One flat fee.",
    popular: false,
    features: [
      "Single business location",
      "Unlimited bill schedules",
      "M-Pesa + PesaLink payments",
      "Auto-generated receipts",
      "Approval workflows",
      "KRA-ready reports",
      "Up to 5 team members",
      "eTIMS integration",
      "Excel / QuickBooks / Zoho sync",
      "Email support",
    ],
  },
  multi: {
    name: "Multi Branch", price: 2999, badge: "badge-green",
    tagline: "Multiple locations. One account.",
    popular: true,
    features: [
      "Multiple business locations",
      "Everything in Solo",
      "Auto-execute on due date",
      "Advanced analytics & reporting",
      "Up to 20 team members",
      "Priority support",
      "Dedicated account manager",
      "Custom bill categories",
    ],
  },
  enterprise: {
    name: "Enterprise", price: null, badge: "badge-purple",
    tagline: "Large operations. Custom pricing.",
    popular: false,
    features: [
      "Unlimited locations",
      "Everything in Multi Branch",
      "Unlimited team members",
      "API access",
      "SLA guarantee",
      "On-site training",
      "Custom integrations",
      "White-label options",
    ],
  },
};

export const ROLE_CONFIG: Record<MemberRole, {
  label: string; badge: string; icon: string; desc: string;
  canApprove: boolean; canExecute: boolean; canWrite: boolean; isAdmin: boolean;
}> = {
  owner:           { label: "Owner",           badge: "badge-purple", icon: "👑", desc: "Full access — billing, settings, all operations.",       canApprove: true,  canExecute: true,  canWrite: true,  isAdmin: true  },
  admin:           { label: "Admin",           badge: "badge-blue",   icon: "🔑", desc: "Manage payees, schedule bills, manage team.",            canApprove: true,  canExecute: true,  canWrite: true,  isAdmin: true  },
  finance_manager: { label: "Finance Manager", badge: "badge-green",  icon: "💼", desc: "Execute approved payments, export reports.",             canApprove: false, canExecute: true,  canWrite: true,  isAdmin: false },
  approver:        { label: "Approver",        badge: "badge-amber",  icon: "✅", desc: "Review and approve or reject payment requests.",         canApprove: true,  canExecute: false, canWrite: false, isAdmin: false },
  viewer:          { label: "Viewer",          badge: "badge-slate",  icon: "👁", desc: "Read-only dashboard and reports access.",                canApprove: false, canExecute: false, canWrite: false, isAdmin: false },
};

export const STATUS_CONFIG: Record<PaymentStatus, { label: string; badge: string }> = {
  draft:            { label: "Draft",            badge: "badge-slate"  },
  pending_approval: { label: "Pending Approval", badge: "badge-amber"  },
  approved:         { label: "Approved",         badge: "badge-blue"   },
  rejected:         { label: "Rejected",         badge: "badge-red"    },
  scheduled:        { label: "Scheduled",        badge: "badge-indigo" },
  executing:        { label: "Processing",       badge: "badge-amber"  },
  completed:        { label: "Completed",        badge: "badge-green"  },
  failed:           { label: "Failed",           badge: "badge-red"    },
  cancelled:        { label: "Cancelled",        badge: "badge-slate"  },
};

export const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: string; provider: string; desc: string }> = {
  pesalink:    { label: "Bank Transfer (PesaLink)", icon: "🏦", provider: "Stanbic PesaLink", desc: "Bank-to-bank via PesaLink"    },
  kcb_paybill: { label: "M-Pesa Paybill",          icon: "📱", provider: "KCB Buni",         desc: "Pay to any M-Pesa paybill"   },
  kcb_till:    { label: "M-Pesa Till",             icon: "🏪", provider: "KCB Buni",         desc: "Pay to an M-Pesa till"       },
  kcb_mobile:  { label: "M-Pesa Send Money",       icon: "📲", provider: "KCB Buni",         desc: "Send to a mobile number"     },
};

export const SUPPLIER_TYPE_CONFIG: Record<SupplierType, { label: string; icon: string }> = {
  bank:         { label: "Bank Account",   icon: "🏦" },
  paybill:      { label: "M-Pesa Paybill", icon: "📱" },
  till:         { label: "M-Pesa Till",    icon: "🏪" },
  mobile_money: { label: "Mobile Money",   icon: "📲" },
  other:        { label: "Other",          icon: "📋" },
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  once:      "One-time",
  daily:     "Daily",
  weekly:    "Weekly",
  biweekly:  "Every 2 weeks",
  monthly:   "Monthly",
  quarterly: "Every 3 months",
  biannual:  "Every 6 months",
  yearly:    "Annually",
};

// ─── Any business type — user types their own ────────────────
export const COMMON_INDUSTRIES = [
  "Restaurant / Food Service", "Logistics & Transport", "Retail & Wholesale",
  "Healthcare / Clinic", "School / Education", "Real Estate / Property",
  "Construction", "Manufacturing", "Agriculture / Farming",
  "Hotel / Hospitality", "Salon / Beauty", "Pharmacy",
  "Hardware / Building Materials", "Petrol Station", "Tour & Travel",
  "IT / Technology", "Legal / Consultancy", "Church / NGO / SACCO", "Other",
];

export const KE_BANKS = [
  "KCB Bank", "Equity Bank", "Co-operative Bank", "Absa Kenya", "Standard Chartered",
  "Stanbic Bank", "DTB", "NCBA", "I&M Bank", "Sidian Bank", "Family Bank",
  "Gulf African Bank", "HF Group", "Bank of Baroda", "Faulu Bank", "Other",
];

export const KE_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Nyeri", "Machakos",
  "Kisii", "Meru", "Kakamega", "Kitale", "Malindi", "Garissa", "Other",
];

export const SUPER_ADMIN_EMAIL = "diondickson3@gmail.com";
export const SUPABASE_REF      = "rnplqhlwvnqrghrjvylx";
export const CALLBACK_URL      = `https://${SUPABASE_REF}.supabase.co/functions/v1/callback`;
export const PAYMENTS_URL      = `https://${SUPABASE_REF}.supabase.co/functions/v1/payments`;
export const TRIAL_DAYS        = 30;
export const ADMIN_WHATSAPP    = "254715800397";
