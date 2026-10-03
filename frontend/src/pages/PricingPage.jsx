import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, HelpCircle, ArrowRight, Zap, Shield, CreditCard } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getCreditPacks, getSubscriptionPlans } from "../api";
import PaymentModal from "../components/PaymentModal";
import { Button, InteractiveCard, Badge } from "../components/ui";

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

export function PricingPage() {
  const { auth, isAuthenticated } = useAuth();
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
      setPacks(packsData || []);
      setPlans(plansData || []);
    } catch (err) {
      console.error("Failed to load pricing:", err);
    } finally {
      setLoading(false);
    }
  };

  const defaultPlans = [
    {
      planId: "pro_monthly",
      label: "Pro Monthly",
      price: "₹799/mo",
      description: "Best for active students, legal associates, and researchers.",
      features: [
        "Unlimited PDF chats",
        "Up to 500 pages per document",
        "Fastest Gemini 2.5 streaming speed",
        "Multi-document workspace",
        "Priority vector search queue",
        "Export citations and chat notes",
      ],
      popular: false,
    },
    {
      planId: "pro_yearly",
      label: "Pro Annual",
      price: "₹6,999/yr",
      description: "Save over 25% with annual billing. Ideal for power users.",
      features: [
        "Everything in Pro Monthly",
        "2 Months Free included",
        "Batch multi-file upload",
        "Early access to new LLM models",
        "Direct email priority support",
        "Extended 1-year history",
      ],
      popular: true,
    },
  ];

  const activePlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="gradient" className="mb-3">
          Transparent, Flexible Pricing
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Choose the right plan for <br className="hidden sm:inline" />
          <span className="text-gradient">your research pace</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Subscribe for unlimited monthly uploads, or purchase non-expiring credit packs as you go.
        </p>

        {/* Tab Toggle (Subscription vs Credit Packs) */}
        <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 backdrop-blur-md">
          <button
            onClick={() => setTab("subscription")}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === "subscription"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pro Subscriptions
          </button>
          <button
            onClick={() => setTab("credits")}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === "credits"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pay-As-You-Go Credits
          </button>
        </div>
      </div>

      {/* Pricing Cards Area */}
      {tab === "subscription" ? (
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {activePlans.map((plan) => (
            <InteractiveCard
              key={plan.planId}
              className={`p-8 flex flex-col justify-between relative ${
                plan.popular ? "border-indigo-500/80 shadow-2xl shadow-indigo-500/20 bg-slate-900/90" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge variant="gradient" size="sm" className="px-3 py-1 shadow-md">
                    <Sparkles className="w-3 h-3 mr-1 text-amber-300" />
                    BEST VALUE
                  </Badge>
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
                  {plan.label}
                </h3>
                <p className="text-xs text-slate-400 mb-6">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-800">
                  {(plan.features || defaultPlans[0].features).map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 mt-auto">
                {isAuthenticated ? (
                  <Button
                    variant={plan.popular ? "primary" : "secondary"}
                    className="w-full justify-center"
                    size="lg"
                    onClick={() => setPaymentModal({ type: "subscription", item: plan })}
                  >
                    Subscribe Now <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Link to="/signup" className="block">
                    <Button
                      variant={plan.popular ? "primary" : "secondary"}
                      className="w-full justify-center"
                      size="lg"
                    >
                      Sign In to Subscribe <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </InteractiveCard>
          ))}
        </div>
      ) : (
        /* Credit Packs */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {(packs.length > 0
            ? packs
            : [
                { credits: 10, price: "₹199", description: "Quick research sprints" },
                { credits: 30, price: "₹499", description: "Most popular for semester prep" },
                { credits: 100, price: "₹1,299", description: "Deep investigation packs" },
              ]
          ).map((pack) => (
            <InteractiveCard key={pack.credits} className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    {pack.credits} Document Credits
                  </span>
                  <CreditCard className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="text-3xl font-extrabold text-white mb-2">
                  {pack.price || `₹${(pack.amount / 100).toLocaleString()}`}
                </h3>
                <p className="text-xs text-slate-400 mb-6">{pack.description || "Upload & chat with full document RAG."}</p>
                
                <ul className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">✓ No expiration date</li>
                  <li className="flex items-center gap-2">✓ Up to 150 pages per PDF</li>
                  <li className="flex items-center gap-2">✓ Works with free account</li>
                </ul>
              </div>

              <div className="pt-6 mt-auto">
                {isAuthenticated ? (
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => setPaymentModal({ type: "credits", item: pack })}
                  >
                    Buy Pack
                  </Button>
                ) : (
                  <Link to="/signup" className="block">
                    <Button variant="secondary" className="w-full justify-center">
                      Sign in to Purchase
                    </Button>
                  </Link>
                )}
              </div>
            </InteractiveCard>
          ))}
        </div>
      )}

      {/* Feature Comparison Table */}
      <div className="mt-28 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Detailed Feature Comparison
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-300 font-semibold">
                <th className="py-4 px-6">Feature</th>
                <th className="py-4 px-6">Free Tier</th>
                <th className="py-4 px-6 text-indigo-400">Pro Subscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-400">
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Daily Upload Quota</td>
                <td className="py-3.5 px-6">3 PDFs / day</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Max Document Size</td>
                <td className="py-3.5 px-6">25 Pages</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">500 Pages</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Vector Search Precision</td>
                <td className="py-3.5 px-6">Standard Embedding</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">Advanced Cross-Encoder Reranking</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Saved Document Library</td>
                <td className="py-3.5 px-6">Session only</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">Permanent Vault Storage</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Export Highlights & Chat</td>
                <td className="py-3.5 px-6">Manual copy</td>
                <td className="py-3.5 px-6 font-semibold text-emerald-400">Markdown & PDF Export</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="mt-28 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div
              key={faq.q}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 cursor-pointer transition-colors hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  {faq.q}
                </span>
                <span className="text-slate-500 font-mono text-lg">
                  {openFaq === i ? "−" : "+"}
                </span>
              </div>
              {openFaq === i && (
                <p className="mt-3 text-xs text-slate-400 leading-relaxed pl-6 animate-fade-in">
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
          onSuccess={() => {
            setPaymentModal(null);
            fetchPricing();
          }}
          onClose={() => setPaymentModal(null)}
        />
      )}
    </div>
  );
}
