// src/components/PaymentModal.jsx — Razorpay checkout modal for credits & subscriptions.
import { useEffect, useRef, useState } from "react";
import { createCreditsOrder, createSubscriptionOrder, verifyPayment } from "../api.js";

export default function PaymentModal({ auth, onClose, onSuccess, type, item, userEmail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const razorpayLoaded = useRef(false);

  useEffect(() => {
    if (window.Razorpay) {
      razorpayLoaded.current = true;
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => { razorpayLoaded.current = true; };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const effectiveEmail = userEmail || auth?.email || "customer@pdfchat.ai";

  useEffect(() => {
    if (type && item) {
      createOrder();
    }
  }, [type, item]);

  const createOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const order = type === "credits"
        ? await createCreditsOrder(auth, item.packId)
        : await createSubscriptionOrder(auth, item.planId);
      setOrderData(order);
    } catch (err) {
      setError(err.message || "Failed to create payment order");
    } finally {
      setLoading(false);
    }
  };

  const openRazorpayCheckout = () => {
    if (!orderData) return;
    if (!window.Razorpay) {
      setError("Payment gateway is initializing. Please click again in 2 seconds.");
      return;
    }

    const options = {
      key: orderData.key,
      name: "PDF Chat AI",
      description: type === "credits"
        ? `Credit Pack: ${orderData.pack?.label || item.label}`
        : `Pro Access: ${orderData.plan?.label || item.label}`,
      prefill: { email: effectiveEmail },
      theme: { color: "#6366f1" },
      handler: async (response) => {
        setLoading(true);
        try {
          await verifyPayment(auth, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          onSuccess?.();
          onClose?.();
        } catch (err) {
          setError(err.message || "Payment verification failed");
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        },
      },
    };

    // Subscriptions use subscription_id without amount or order_id
    if (orderData.subscriptionId && !orderData.orderId) {
      options.subscription_id = orderData.subscriptionId;
    } else {
      options.order_id = orderData.orderId;
      options.amount = orderData.amount;
      options.currency = orderData.currency || "INR";
    }

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setError(response.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (openErr) {
      setError(openErr.message || "Could not open Razorpay checkout");
    }
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