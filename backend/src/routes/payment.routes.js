// src/routes/payment.routes.js — Payment API endpoints and Razorpay webhook.
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { logger } from "../lib/logger.js";
import { collections } from "../db/database.js";
import {
  createCreditsOrder,
  createSubscriptionOrder,
  verifyPaymentAndGrant,
  getUserCredits,
  getPaymentHistory,
  getCreditTransactions,
  verifyWebhookSignature,
  handleWebhookEvent,
  CREDIT_PACKS,
  SUBSCRIPTION_PLANS,
} from "../services/paymentService.js";

export const paymentRouter = Router();

// GET /api/payments/credits/balance or /api/payments/credits — Get user's credit balance and subscription status
paymentRouter.get(["/credits/balance", "/credits"], requireAuth, async (req, res, next) => {
  try {
    const data = await getUserCredits(req.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/credits/packs — List available credit packs
paymentRouter.get("/credits/packs", async (req, res) => {
  const packs = Array.isArray(CREDIT_PACKS)
    ? CREDIT_PACKS
    : Object.entries(CREDIT_PACKS).map(([packId, p]) => ({ ...p, packId }));
  res.json({ packs });
});

// GET /api/payments/subscription/plans — List available subscription plans
paymentRouter.get("/subscription/plans", async (req, res) => {
  const plans = Array.isArray(SUBSCRIPTION_PLANS)
    ? SUBSCRIPTION_PLANS
    : Object.entries(SUBSCRIPTION_PLANS).map(([planId, p]) => ({ ...p, planId }));
  res.json({ plans });
});

// POST /api/payments/credits/order — Create Razorpay order for credit pack
paymentRouter.post("/credits/order", requireAuth, async (req, res, next) => {
  try {
    const { packId } = req.body;
    if (!packId) throw new ApiError(400, "MISSING_PACK_ID", "packId is required");

    const user = await collections.users().findOne({ _id: req.userId });
    const order = await createCreditsOrder(req.userId, packId, user?.email);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/subscription/order — Create Razorpay subscription order
paymentRouter.post("/subscription/order", requireAuth, async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId) throw new ApiError(400, "MISSING_PLAN_ID", "planId is required");

    const user = await collections.users().findOne({ _id: req.userId });
    const order = await createSubscriptionOrder(req.userId, planId, user?.email);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/verify — Verify payment after Razorpay checkout (frontend calls this)
paymentRouter.post("/verify", requireAuth, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;
    if ((!razorpay_order_id && !razorpay_subscription_id) || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "MISSING_FIELDS", "Missing payment verification fields (order/subscription ID, payment ID, or signature)");
    }

    const result = await verifyPaymentAndGrant(req.userId, {
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    res.json({
      success: true,
      alreadyProcessed: result.alreadyProcessed,
      credits: result.payment?.creditsGranted,
      planId: result.payment?.planId,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/history — Get payment history
paymentRouter.get("/history", requireAuth, async (req, res, next) => {
  try {
    const payments = await getPaymentHistory(req.userId);
    res.json({ payments });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/transactions — Get credit transaction history
paymentRouter.get("/transactions", requireAuth, async (req, res, next) => {
  try {
    const transactions = await getCreditTransactions(req.userId);
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/webhook — Razorpay webhook endpoint (no auth, verified by signature)
paymentRouter.post("/webhook", async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const payload = JSON.stringify(req.body);

    if (!signature || !verifyWebhookSignature(payload, signature)) {
      logger.warn("Invalid webhook signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = req.body;
    await handleWebhookEvent(event);

    res.json({ status: "ok" });
  } catch (err) {
    logger.error({ err }, "Webhook processing failed");
    // Return 200 to prevent Razorpay retries for processing errors
    // But log the error for investigation
    res.status(200).json({ status: "error", message: "Webhook processing failed" });
  }
});