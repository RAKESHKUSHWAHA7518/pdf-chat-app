// src/components/PricingPage.jsx — Pricing page for credit packs and Pro subscription.
import { useState, useEffect } from "react";
import { getCreditPacks, getSubscriptionPlans } from "../api.js";
import PaymentModal from "./PaymentModal.jsx";

export default function PricingPage({ auth, onClose }) {
  const [packs, setPacks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(null);

  useEffect(() => {
    fetchPricing();
  }, [auth]);

  const fetchPricing = async () => {
    try {
      const [packsData, plansData] = await Promise.all([
        getCreditPacks(auth),
        getSubscriptionPlans(auth),
      ]);
      setPacks(packsData);
      setPlans(plansData);
    } catch (err) {
      console.error("Failed to fetch pricing:", err);
    } finally {
      setLoading(false);
    }
  };

  const openPayment = (type, item) => {
    setPaymentModal({ type, item });
  };

  const handlePaymentSuccess = () => {
    setPaymentModal(null);
    // Refresh will be handled by parent
  };

  if (loading) return <div className="pricing-loading">Loading pricing...</div>;

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Unlock unlimited PDF chats or buy credits as you go</p>
      </div>

      <div className="pricing-tabs">
        <button
          className={`pricing-tab ${!paymentModal ? "active" : ""}`}
          onClick={() => setPaymentModal(null)}
        >
          Credit Packs
        </button>
        <button className={`pricing-tab`}>Pro Subscription</button>
      </div>

      <div className="pricing-grid">
        {/* Credit Packs */}
        <section className="pricing-section">
          <h2>Pay-Per-Document Credits</h2>
          <p className="section-subtitle">Buy credits, use them anytime. No expiry.</p>
          <div className="cards">
            {packs.map((pack) => (
              <div key={pack.credits} className="pricing-card">
                <div className="card-header">
                  <span className="credits-badge">{pack.credits} Credits</span>
                  <span className="price">{pack.price || `₹${(pack.amount / 100).toLocaleString()}`}</span>
                </div>
                <ul className="features">
                  <li>✓ {pack.credits} PDF uploads</li>
                  <li>✓ No expiration</li>
                  <li>✓ Works with free account</li>
                  <li>✓ Priority processing</li>
                </ul>
                <button
                  className="btn-primary"
                  onClick={() => openPayment("credits", pack)}
                  disabled={!auth}
                >
                  {auth ? "Buy Now" : "Sign In to Buy"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="pricing-section">
          <h2>Pro Subscription</h2>
          <p className="section-subtitle">Unlimited PDFs, best value for heavy users.</p>
          <div className="cards">
            {plans.map((plan) => (
              <div key={plan.planId} className={`pricing-card ${plan.planId === "pro_yearly" ? "popular" : ""}`}>
                {plan.planId === "pro_yearly" && <span className="popular-badge">Best Value</span>}
                <div className="card-header">
                  <span className="plan-name">{plan.label}</span>
                  <span className="price">{plan.price}</span>
                </div>
                <ul className="features">
                  {plan.features?.map((f, i) => (
                    <li key={i}><span className="check">✓</span> {f}</li>
                  ))}
                </ul>
                <button
                  className={`btn-primary ${plan.planId === "pro_yearly" ? "btn-popular" : ""}`}
                  onClick={() => openPayment("subscription", { ...plan, planId: plan.planId })}
                  disabled={!auth}
                >
                  {auth ? `Subscribe to ${plan.label}` : "Sign In to Subscribe"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {paymentModal && (
        <PaymentModal
          type={paymentModal.type}
          item={paymentModal.item}
          userEmail={auth?.email}
          onClose={() => setPaymentModal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}