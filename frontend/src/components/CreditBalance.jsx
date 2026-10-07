// src/components/CreditBalance.jsx — Shows user's credit balance and subscription status.
import { useEffect, useState } from "react";
import { getCreditBalance } from "../api.js";

export default function CreditBalance({ auth, onRefresh }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) fetchBalance();
  }, [auth]);

  const fetchBalance = async (retries = 2) => {
    setLoading(true);
    try {
      const data = await getCreditBalance(auth);
      setBalance(data);
    } catch (err) {
      if (retries > 0 && (err.status === 502 || err.status === 504 || err.message?.includes("starting up"))) {
        setTimeout(() => fetchBalance(retries - 1), 1500);
        return;
      }
      console.warn("Balance fetch:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  if (!auth) return null;

  if (loading && !balance) {
    return (
      <div className="credit-balance-loading">
        <span className="balance-pulse-dot" />
        <span className="balance-loading-text">Loading balance...</span>
      </div>
    );
  }

  if (!balance) return null;

  const { credits, subscription } = balance;
  const hasActiveSub =
    subscription?.status === "active" &&
    subscription?.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd) > new Date();

  return (
    <div className="credit-balance-row">
      <div className="credit-stat">
        <span className="credit-stat-icon">⚡</span>
        <div className="credit-stat-data">
          <span className="credit-stat-label">Available Credits</span>
          <span className="credit-stat-count">{credits ?? 0}</span>
        </div>
      </div>

      <div className="plan-status-pill">
        {hasActiveSub ? (
          <span className="badge-sub active" title="Active Pro Subscription">Pro Active</span>
        ) : subscription?.status === "cancelled" ? (
          <span className="badge-sub cancelled" title="Cancelled subscription">Cancelled</span>
        ) : (
          <span className="badge-sub free" title="Free standard tier">Standard</span>
        )}
      </div>
    </div>
  );
}