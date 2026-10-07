import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, HelpCircle, ArrowRight, Zap, Shield, CreditCard, Lock, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getCreditPacks, getSubscriptionPlans } from "../api";
import PaymentModal from "../components/PaymentModal";

const SUBSCRIPTION_METADATA = {
  pro_monthly: {
    label: "Pro Monthly",
    price: "₹299/mo",
    billingCycle: "Billed monthly · Cancel anytime with 1 click",
    description: "Best for active students, legal associates, and researchers.",
    features: [
      "Unlimited PDF uploads & chat queries",
      "Up to 500 pages per document",
      "Fastest Gemini 2.5 Flash streaming speed",
      "Interactive split-screen PDF document viewer",
      "Precise clickable citation page references",
      "Permanent document library & chat history",
      "Priority vector search queue",
    ],
    popular: false,
  },
  pro_yearly: {
    label: "Pro Yearly",
    price: "₹2,990/yr",
    billingCycle: "Billed annually · Effective ₹249/mo (Save 17%)",
    description: "Maximum efficiency and priority compute for power researchers.",
    features: [
      "Everything included in Pro Monthly",
      "2 Months Free included (Save ~17%)",
      "Highest priority AI processing queue",
      "Batch multi-document cross-referencing",
      "Early access to next-gen reasoning models",
      "Export full citations, notes & LaTeX summaries",
      "Dedicated priority email support",
    ],
    popular: true,
  },
};

const CREDIT_PACK_METADATA = {
  pack_10: {
    credits: 10,
    price: "₹299",
    label: "10 Document Credits",
    badge: "Starter",
    description: "Ideal for occasional term papers & contract review sprints.",
    features: [
      "10 full PDF document uploads",
      "No expiration date — credits roll over forever",
      "Up to 500 pages per document",
      "Full interactive chat & page citations",
      "Works with free standard account",
      "Interactive split-screen PDF viewer",
    ],
    popular: false,
  },
  pack_50: {
    credits: 50,
    price: "₹1,299",
    label: "50 Document Credits",
    badge: "Most Popular Pack",
    description: "Best per-document value for semester-long research.",
    features: [
      "50 full PDF document uploads",
      "Save ~15% compared to single packs",
      "No expiration date — credits roll over forever",
      "Up to 500 pages per document",
      "Priority queue for document vectorization",
      "Permanent document vault storage",
    ],
    popular: true,
  },
  pack_100: {
    credits: 100,
    price: "₹2,299",
    label: "100 Document Credits",
    badge: "Power Researcher",
    description: "High volume bulk pack for research labs and legal teams.",
    features: [
      "100 full PDF document uploads",
      "Save ~25% compared to single packs",
      "No expiration date — credits roll over forever",
      "Dedicated high-speed vector ingestion",
      "Full interactive chat & page citations",
      "Export citations & full chat summaries",
    ],
    popular: false,
  },
};

const FAQS = [
  {
    q: "How does the PDF page limit work?",
    a: "On the Free tier, documents up to 25 pages are supported. Pro accounts support up to 500 pages per PDF document, with full deep vector retrieval across all chapters and tables.",
  },
  {
    q: "Do purchased credits ever expire?",
    a: "Never. Credits purchased via Credit Packs stay in your account forever until you choose to spend them on document uploads.",
  },
  {
    q: "Are my confidential files private and secure?",
    a: "Yes, 100%. We employ zero-retention policies with LLM providers. Your proprietary documents and text embeddings are strictly your own and are never used to train foundational AI models.",
  },
  {
    q: "Can I cancel my Pro subscription at any time?",
    a: "Absolutely. You can cancel with a single click in your Settings dashboard. You will retain Pro benefits until the end of your billing cycle.",
  },
];

export function PricingPage({ auth: propAuth, onClose } = {}) {
  const authContext = useAuth();
  const auth = propAuth || authContext?.auth;
  const isAuthenticated = Boolean(auth?.token || authContext?.isAuthenticated);
  const [tab, setTab] = useState("subscription"); // 'subscription' | 'credits'
  const [packs, setPacks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    fetchPricing();
  }, [auth]);

  const fetchPricing = async () => {
    try {
      const [packsData, plansData] = await Promise.all([
        getCreditPacks(auth).catch(() => []),
        getSubscriptionPlans(auth).catch(() => []),
      ]);
      setPacks(Array.isArray(packsData) ? packsData : []);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (err) {
      console.error("Failed to load pricing:", err);
    } finally {
      setLoading(false);
    }
  };

  // Merge backend data with rich metadata
  const activePlans = [
    { planId: "pro_monthly", ...SUBSCRIPTION_METADATA.pro_monthly },
    { planId: "pro_yearly", ...SUBSCRIPTION_METADATA.pro_yearly },
  ].map((meta) => {
    const backendMatch = plans.find((p) => p.planId === meta.planId);
    return backendMatch ? { ...meta, ...backendMatch } : meta;
  });

  const activePacks = [
    { packId: "pack_10", ...CREDIT_PACK_METADATA.pack_10 },
    { packId: "pack_50", ...CREDIT_PACK_METADATA.pack_50 },
    { packId: "pack_100", ...CREDIT_PACK_METADATA.pack_100 },
  ].map((meta) => {
    const backendMatch = packs.find((p) => p.packId === meta.packId);
    return backendMatch ? { ...meta, ...backendMatch } : meta;
  });

  const mainContent = (
    <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${onClose ? "pt-6 pb-20" : "pt-28 pb-20 sm:pt-36 sm:pb-24"}`}>
      {onClose && (
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white tracking-wide">Manage Plan & Credits</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-semibold shadow-md active:scale-95"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
      )}
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-5 shadow-sm backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Transparent, Flexible Pricing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-5 leading-[1.15]">
          Choose the right plan for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            your research pace
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Subscribe for unlimited monthly uploads, or purchase non-expiring credit packs as you go.
          Powered by Razorpay 256-bit secure checkout.
        </p>

        {/* Segmented Control Tabs */}
        <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-black/50 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setTab("subscription")}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${tab === "subscription"
              ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/30"
              : "text-slate-400 hover:text-white"
              }`}
          >
            <Zap className="w-4 h-4" />
            <span>Pro Subscriptions</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("credits")}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${tab === "credits"
              ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/30"
              : "text-slate-400 hover:text-white"
              }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Pay-As-You-Go Credits</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Area */}
      {tab === "subscription" ? (
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {activePlans.map((plan) => {
            const isYearly = plan.popular || plan.planId === "pro_yearly";

            return (
              <div
                key={plan.planId}
                className={`rounded-3xl p-8 sm:p-9 flex flex-col justify-between transition-all duration-300 relative group backdrop-blur-2xl ${isYearly
                  ? "bg-gradient-to-b from-indigo-950/45 via-slate-900/90 to-slate-950/95 border-2 border-indigo-500/80 shadow-[0_0_50px_rgba(99,102,241,0.22)] hover:shadow-[0_0_70px_rgba(99,102,241,0.35)] hover:-translate-y-1"
                  : "bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 shadow-xl shadow-black/40 hover:shadow-2xl hover:-translate-y-1"
                  }`}
              >
                {/* Popular Top Badge */}
                {isYearly && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/40 border border-indigo-300/30">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      BEST VALUE · SAVE 17%
                    </span>
                  </div>
                )}

                {/* Subtle top edge gradient reflection */}
                <div
                  className={`absolute inset-x-0 top-0 h-px ${isYearly
                    ? "bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                    : "bg-gradient-to-r from-transparent via-slate-700 to-transparent"
                    }`}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {plan.label}
                    </h3>
                    {isYearly && (
                      <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                        Annual Plan
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${isYearly
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-200"
                        : "text-white"
                        }`}
                    >
                      {plan.price}
                    </span>
                  </div>
                  <p className={`text-xs font-medium mb-6 ${isYearly ? "text-indigo-300 font-semibold" : "text-slate-400"}`}>
                    {plan.billingCycle}
                  </p>

                  {/* Divider */}
                  <div className={`h-px my-6 ${isYearly ? "bg-indigo-500/25" : "bg-slate-800/80"}`} />

                  {/* Features List */}
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call To Action Button */}
                <div className="pt-4 mt-auto">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => setPaymentModal({ type: "subscription", item: plan })}
                      className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${isYearly
                        ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/35 hover:shadow-indigo-500/50"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80 shadow-md hover:shadow-lg"
                        }`}
                    >
                      <span>Subscribe to {plan.label}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <Link to="/signup" className="block">
                      <button
                        type="button"
                        className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${isYearly
                          ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/35 hover:shadow-indigo-500/50"
                          : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80 shadow-md hover:shadow-lg"
                          }`}
                      >
                        <span>Sign In to Subscribe</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Credit Packs Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {activePacks.map((pack) => {
            const isPopular = pack.popular || pack.credits === 50;

            return (
              <div
                key={pack.packId || pack.credits}
                className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 relative group backdrop-blur-2xl ${isPopular
                  ? "bg-gradient-to-b from-indigo-950/40 via-slate-900/90 to-slate-950/95 border-2 border-indigo-500/80 shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:shadow-[0_0_60px_rgba(99,102,241,0.3)] hover:-translate-y-1"
                  : "bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 shadow-xl shadow-black/40 hover:shadow-2xl hover:-translate-y-1"
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/40 border border-indigo-300/30">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      MOST POPULAR PACK
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/15 px-3 py-1 rounded-lg border border-indigo-500/25">
                      {pack.credits} Document Credits
                    </span>
                    <CreditCard className="w-4 h-4 text-slate-400" />
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
                    {pack.price}
                  </h3>
                  <p className="text-xs text-indigo-400 font-medium mb-4">One-time payment · Never expires</p>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">{pack.description}</p>

                  <div className="h-px bg-slate-800/80 my-4" />

                  <ul className="space-y-3 mb-6">
                    {pack.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 mt-auto">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => setPaymentModal({ type: "credits", item: pack })}
                      className={`w-full py-3 px-5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${isPopular
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/30"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80"
                        }`}
                    >
                      <span>Buy {pack.credits} Credits</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link to="/signup" className="block">
                      <button
                        type="button"
                        className={`w-full py-3 px-5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${isPopular
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/30"
                          : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80"
                          }`}
                      >
                        <span>Sign In to Buy</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Security Assurance Badge */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border border-slate-800/80 bg-slate-900/50 rounded-2xl py-3 px-6 max-w-3xl mx-auto backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>256-bit SSL Razorpay Checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Zero Card Details Stored</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Instant Feature Activation</span>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-24 sm:mt-28 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">
          Detailed Feature Comparison
        </h2>
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-300 font-semibold">
                <th className="py-4 px-6">Feature</th>
                <th className="py-4 px-6">Free Tier</th>
                <th className="py-4 px-6 text-indigo-400">Pro Subscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-400">
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Daily Upload Quota</td>
                <td className="py-3.5 px-6">3 PDFs / day</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Max Document Size</td>
                <td className="py-3.5 px-6">25 Pages</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">500 Pages per file</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Vector Search Precision</td>
                <td className="py-3.5 px-6">Standard Embedding</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">Advanced Semantic Reranking</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Saved Document Library</td>
                <td className="py-3.5 px-6">Session only</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">Permanent Vault Storage</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Interactive Split Screen</td>
                <td className="py-3.5 px-6">Basic View</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">Full Dual-Pane with Jump-to-Page</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Export Highlights & Chat</td>
                <td className="py-3.5 px-6">Manual copy</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">Markdown & Citations Export</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="mt-24 sm:mt-28 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div
              key={faq.q}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 cursor-pointer transition-colors hover:border-slate-700 shadow-md backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm sm:text-base text-slate-200 flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  {faq.q}
                </span>
                <span className="text-slate-500 font-mono text-xl ml-3">
                  {openFaq === i ? "−" : "+"}
                </span>
              </div>
              {openFaq === i && (
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed pl-6 animate-fade-in">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <PaymentModal
          auth={auth}
          type={paymentModal.type}
          item={paymentModal.item}
          userEmail={auth?.email}
          onSuccess={() => {
            setPaymentModal(null);
            fetchPricing();
          }}
          onClose={() => setPaymentModal(null)}
        />
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl overflow-y-auto">
        {mainContent}
      </div>
    );
  }

  return mainContent;
}
export default PricingPage;
