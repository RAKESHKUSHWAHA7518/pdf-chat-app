// src/components/PricingPage.jsx — Pricing modal for credit packs and Pro subscription.
import { useState, useEffect } from "react";
import { X, Sparkles, Check, Zap, ShieldCheck } from "lucide-react";
import { getCreditPacks, getSubscriptionPlans } from "../api.js";
import PaymentModal from "./PaymentModal.jsx";
import "../App.css";

const DEFAULT_SUB_FEATURES = {
  pro_monthly: [
    "Unlimited PDF uploads & chat queries",
    "Gemini 2.5 Flash AI reasoning engine",
    "Interactive split-screen PDF document viewer",
    "Precise clickable citation page references",
    "Document library with saved history",
    "Priority AI processing speed",
  ],
  pro_yearly: [
    "Everything included in Pro Monthly",
    "Save ~17% compared to monthly billing",
    "Highest priority AI processing queue",
    "Early access to next-gen AI features",
    "Export citations & full chat summaries",
  ],
};

const DEFAULT_CREDIT_FEATURES = [
  "No expiration date — credits roll over forever",
  "Full interactive chat & page-level citations",
  "Split-screen PDF viewer support",
  "Pay only when you upload new documents",
];

export default function PricingPage({ auth, onClose }) {
  const [packs, setPacks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("subscription"); // "subscription" | "credits"
  const [paymentModal, setPaymentModal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchPricing = async () => {
    try {
      const [packsData, plansData] = await Promise.all([
        getCreditPacks(auth),
        getSubscriptionPlans(auth),
      ]);

      const normalizedPacks = Array.isArray(packsData)
        ? packsData
        : (packsData && typeof packsData === "object"
            ? Object.entries(packsData).map(([packId, p]) => ({ ...p, packId }))
            : []);

      const normalizedPlans = Array.isArray(plansData)
        ? plansData
        : (plansData && typeof plansData === "object"
            ? Object.entries(plansData).map(([planId, p]) => ({ ...p, planId }))
            : []);

      if (cancelled) return;
      setPacks(normalizedPacks);
      setPlans(normalizedPlans);
    } catch (err) {
      console.error("Failed to fetch pricing:", err);
      // Fallback defaults so UI never breaks
      setPacks([
        { packId: "pack_10", credits: 10, amount: 29900, label: "10 PDF Credits" },
        { packId: "pack_50", credits: 50, amount: 129900, label: "50 PDF Credits" },
      ]);
      setPlans([
        { planId: "pro_monthly", label: "Pro Monthly", price: "₹299/mo", interval: "monthly" },
        { planId: "pro_yearly", label: "Pro Yearly", price: "₹2,990/yr", interval: "yearly" },
      ]);
    } finally {
      if (!cancelled) setLoading(false);
    }
    };
    fetchPricing();
    return () => { cancelled = true; };
  }, [auth]);

  const getPackPrice = (pack) => {
    if (pack.price) return pack.price;
    if (pack.amount) return `₹${Math.round(pack.amount / 100).toLocaleString("en-IN")}`;
    return "₹99";
  };

  const openPayment = (type, item) => {
    setPaymentModal({ type, item });
  };

  const handlePaymentSuccess = () => {
    setPaymentModal(null);
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay pricing-overlay" onClick={onClose}>
      <div className="pricing-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="pricing-modal-header">
          <div className="pricing-pill-badge">
            <Sparkles size={13} /> Flexible AI Plans & Credits
          </div>
          <h2>Upgrade Your PDF Intelligence</h2>
          <p>
            Choose unlimited monthly access or buy credits on demand. Powered by Razorpay secure payments.
          </p>
        </div>

        <div className="pricing-tabs">
          <button
            type="button"
            className={`pricing-tab ${activeTab === "subscription" ? "active" : ""}`}
            onClick={() => setActiveTab("subscription")}
          >
            <Zap size={14} /> Pro Subscriptions
          </button>
          <button
            type="button"
            className={`pricing-tab ${activeTab === "credits" ? "active" : ""}`}
            onClick={() => setActiveTab("credits")}
          >
            <Sparkles size={14} /> Pay-As-You-Go Credits
          </button>
        </div>

        {loading ? (
          <div className="pricing-loading-box">
            <div className="spinner" />
            <p>Loading available plans...</p>
          </div>
        ) : (
          <div className="pricing-content">
            {activeTab === "subscription" && (
              <div className="pricing-cards-grid">
                {plans.map((plan) => {
                  const isYearly = plan.planId === "pro_yearly" || plan.interval === "yearly";
                  const features = plan.features || (isYearly ? DEFAULT_SUB_FEATURES.pro_yearly : DEFAULT_SUB_FEATURES.pro_monthly);

                  return (
                    <div
                      key={plan.planId || plan.label}
                      className={`pricing-tier-card ${isYearly ? "popular" : ""}`}
                    >
                      {isYearly && <div className="popular-badge">⚡ Best Value · Save 17%</div>}
                      <div className="card-top">
                        <span className="tier-name">{plan.label}</span>
                        <div className="tier-price-wrap">
                          <span className="tier-price">{plan.price || (plan.amount ? `₹${Math.round(plan.amount / 100)}` : "₹299")}</span>
                        </div>
                        <p className="tier-desc">
                          {isYearly ? "Billed annually. Full unlimited access for power users." : "Billed monthly. Cancel anytime with one click."}
                        </p>
                      </div>

                      <div className="tier-divider" />

                      <ul className="tier-features">
                        {features.map((feat, idx) => (
                          <li key={idx}>
                            <Check size={14} className="feat-check" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        className={`tier-cta-btn ${isYearly ? "btn-popular" : "btn-standard"}`}
                        onClick={() => openPayment("subscription", { ...plan, planId: plan.planId })}
                        disabled={!auth}
                      >
                        {auth ? `Subscribe to ${plan.label}` : "Sign In to Subscribe"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "credits" && (
              <div className="pricing-cards-grid">
                {packs.map((pack) => {
                  const priceStr = getPackPrice(pack);
                  const is50 = pack.credits >= 50;

                  return (
                    <div
                      key={pack.packId || pack.credits}
                      className={`pricing-tier-card ${is50 ? "popular" : ""}`}
                    >
                      {is50 && <div className="popular-badge">Most Popular Pack</div>}
                      <div className="card-top">
                        <span className="tier-name">{pack.label || `${pack.credits} Credits`}</span>
                        <div className="tier-price-wrap">
                          <span className="tier-price">{priceStr}</span>
                          <span className="tier-subtext">one-time payment</span>
                        </div>
                        <p className="tier-desc">
                          {pack.credits} full document uploads. Ideal for occasional research.
                        </p>
                      </div>

                      <div className="tier-divider" />

                      <ul className="tier-features">
                        <li>
                          <Check size={14} className="feat-check" />
                          <span><strong>{pack.credits}</strong> PDF document uploads</span>
                        </li>
                        {DEFAULT_CREDIT_FEATURES.map((feat, idx) => (
                          <li key={idx}>
                            <Check size={14} className="feat-check" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        className={`tier-cta-btn ${is50 ? "btn-popular" : "btn-standard"}`}
                        onClick={() => openPayment("credits", { ...pack, price: priceStr })}
                        disabled={!auth}
                      >
                        {auth ? `Buy ${pack.credits} Credits` : "Sign In to Buy"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pricing-footer-note">
              <ShieldCheck size={14} className="shield-icon" />
              <span>Payments are secured with 256-bit SSL encryption via Razorpay. Cancel subscriptions anytime.</span>
            </div>
          </div>
        )}

        {paymentModal && (
          <PaymentModal
            auth={auth}
            type={paymentModal.type}
            item={paymentModal.item}
            userEmail={auth?.email}
            onClose={() => setPaymentModal(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}