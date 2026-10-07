// src/components/CreditBalance.jsx — Shows user's credit balance and subscription status.
import { useEffect, useState } from "react";
import { getCreditBalance } from "../api.js";

export default function CreditBalance({ auth, onBalanceChange, refreshTrigger, onRefresh }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      fetchBalance();
    } else {
      setBalance(null);
      onBalanceChange?.(null);
    }
  }, [auth, refreshTrigger]);

  const fetchBalance = async (retries = 2) => {
    setLoading(true);
    try {
      const data = await getCreditBalance(auth);
      setBalance(data);
      onBalanceChange?.(data);
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
  const isPro =
    balance.isPro ??
    Boolean(
      subscription?.status === "active" &&
      subscription?.currentPeriodEnd &&
      new Date(subscription.currentPeriodEnd) > new Date()
    );

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
        {isPro ? (
          <span className="badge-sub active" title="Active Pro Subscription">Pro Active</span>
        ) : subscription?.status === "cancelled" ? (
          <span className="badge-sub cancelled" title="Cancelled subscription">Cancelled</span>
        ) : (credits ?? 0) === 0 ? (
          <span className="badge-sub empty" title="0 free credits left · Upgrade to Pro or purchase credits">0 Credits</span>
        ) : (
          <span className="badge-sub free" title="Free standard account">Free Account</span>
        )}
      </div>
    </div>
  );
}