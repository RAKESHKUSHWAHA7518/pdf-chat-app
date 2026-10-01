// src/components/CreditBalance.jsx — Shows user's credit balance and subscription status.
import { useEffect, useState } from "react";
import { getCreditBalance } from "../api.js";

export default function CreditBalance({ auth, onRefresh }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) fetchBalance();
  }, [auth]);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const data = await getCreditBalance(auth);
      setBalance(data);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!auth || loading) return null;
  if (!balance) return null;

  const { credits, subscription } = balance;
  const hasActiveSub = subscription?.status === "active" &&
    subscription?.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd) > new Date();

  return (
    <div className="credit-balance">
      <div className="credit-item">
        <span className="credit-label">Credits</span>
        <span className="credit-value">{credits}</span>
      </div>

      <div className="credit-item subscription">
        <span className="credit-label">
          {hasActiveSub ? (
            <>
              Pro Plan
              <span className="badge active">Active</span>
            </>
          ) : subscription?.status === "cancelled" ? (
            <>
              Pro Plan
              <span className="badge cancelled">Cancelled</span>
            </>
          ) : (
            "Pro Plan"
          )}
        </span>
        {hasActiveSub && subscription.currentPeriodEnd && (
          <span className="credit-value">
            Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}