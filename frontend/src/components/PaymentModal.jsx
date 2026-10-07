// src/components/PaymentModal.jsx — Razorpay checkout modal for credits & subscriptions.
import { useEffect, useRef, useState } from "react";
import { createCreditsOrder, createSubscriptionOrder, verifyPayment } from "../api.js";

export default function PaymentModal({ auth, onClose, onSuccess, type, item, userEmail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const razorpayLoaded = useRef(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => { razorpayLoaded.current = true; };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    if (type && item && userEmail) {
      createOrder();
    }
  }, [type, item, userEmail]);

  const createOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const order = type === "credits"
        ? await createCreditsOrder(auth, item.packId)
        : await createSubscriptionOrder(auth, item.planId);
      setOrderData(order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openRazorpayCheckout = () => {
    if (!razorpayLoaded.current || !orderData) return;

    const displayPrice = item.price || (item.amount ? `₹${Math.round(item.amount / 100)}` : "");

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "PDF Chat",
      description: type === "credits" ? `Credit Pack: ${orderData.pack?.label || item.label}` : `Subscription: ${orderData.plan?.label || item.label}`,
      order_id: orderData.orderId || orderData.subscriptionId,
      prefill: { email: userEmail },
      theme: { color: "#6366f1" },
      handler: async (response) => {
        setLoading(true);
        try {
          await verifyPayment(auth, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          onSuccess?.();
          onClose?.();
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      modal: { ondismiss: () => { setLoading(false); } },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      setError(response.error?.description || "Payment failed");
    });
    rzp.open();
  };

  if (loading && !orderData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <div className="spinner" />
          <p>Preparing payment...</p>
        </div>
      </div>
    );
  }

  if (error && !orderData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <div className="auth-error">⚠️ {error}</div>
          <button className="auth-submit-btn" onClick={createOrder}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="auth-title">{type === "credits" ? `Buy ${item.label}` : `Subscribe to ${item.label}`}</h2>
        <p className="auth-subtitle">
          {type === "credits"
            ? `Get ${item.credits} PDF credits for ${item.price || (item.amount ? `₹${Math.round(item.amount / 100)}` : "")}`
            : `${item.price || (item.amount ? `₹${Math.round(item.amount / 100)}` : "")} — Unlimited PDF uploads, priority processing, larger files`}
        </p>

        <div className="payment-summary">
          <div className="payment-row">
            <span>{type === "credits" ? "Credits" : "Plan"}</span>
            <strong>{type === "credits" ? item.credits : item.label}</strong>
          </div>
          <div className="payment-row total">
            <span>Total</span>
            <strong>{item.price || (item.amount ? `₹${Math.round(item.amount / 100)}` : "")}</strong>
          </div>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <button
          className="auth-submit-btn razorpay-btn"
          onClick={openRazorpayCheckout}
          disabled={loading || !orderData}
        >
          {loading ? "Processing..." : `Pay ${item.price || (item.amount ? `₹${Math.round(item.amount / 100)}` : "")} with Razorpay`}
        </button>

        <p className="auth-note">🔒 Secure payment via Razorpay. We never store your card details.</p>
      </div>
    </div>
  );
}