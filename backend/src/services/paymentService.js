// src/services/paymentService.js — Razorpay payment processing, credits, subscriptions.
import crypto from "node:crypto";
import Razorpay from "razorpay";

import { env } from "../config/env.js";
import { collections } from "../db/database.js";
import { ApiError } from "../middleware/errorHandler.js";
import { logger } from "../lib/logger.js";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const CREDIT_PACKS = {
  pack_10: { credits: 10, amount: env.RAZORPAY_CREDITS_PACK_10_AMOUNT, label: "10 PDF Credits" },
  pack_50: { credits: 50, amount: env.RAZORPAY_CREDITS_PACK_50_AMOUNT, label: "50 PDF Credits" },
  pack_100: { credits: 100, amount: env.RAZORPAY_CREDITS_PACK_100_AMOUNT, label: "100 PDF Credits" },
};

export const SUBSCRIPTION_PLANS = {
  pro_monthly: {
    planId: env.RAZORPAY_PLAN_PRO_MONTHLY || "plan_Tl77SFPCromUyx",
    amount: env.RAZORPAY_PRO_MONTHLY_AMOUNT,
    interval: "monthly",
    label: "Pro Monthly",
    price: "₹299/mo",
  },
  pro_yearly: {
    planId: env.RAZORPAY_PLAN_PRO_YEARLY || "plan_Tl78c7YHFac2ya",
    amount: env.RAZORPAY_PRO_YEARLY_AMOUNT,
    interval: "yearly",
    label: "Pro Yearly",
    price: "₹2,999/yr",
  },
};

function verifyRazorpayOrderSignature(orderId, paymentId, signature) {
  if (!signature || !orderId || !paymentId) return false;
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  const expectedBuf = Buffer.from(expectedSignature);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

function verifyRazorpaySubscriptionSignature(subscriptionId, paymentId, signature) {
  if (!signature || !subscriptionId || !paymentId) return false;
  const body = `${paymentId}|${subscriptionId}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  const expectedBuf = Buffer.from(expectedSignature);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

async function getOrCreateRazorpayCustomer(userId, email) {
  const user = await collections.users().findOne({ _id: userId });
  if (user?.subscription?.razorpayCustomerId) {
    return user.subscription.razorpayCustomerId;
  }

  const customer = await razorpay.customers.create({
    email: email || "customer@pdfchat.ai",
    contact: "",
    notes: { userId },
  });

  await collections.users().updateOne(
    { _id: userId },
    { $set: { "subscription.razorpayCustomerId": customer.id } }
  );
  return customer.id;
}

export async function createCreditsOrder(userId, packId, email) {
  const pack = CREDIT_PACKS[packId];
  if (!pack) throw new ApiError(400, "INVALID_PACK", "Invalid credit pack");

  const order = await razorpay.orders.create({
    amount: pack.amount,
    currency: "INR",
    receipt: `credits_${userId}_${Date.now()}`.slice(0, 40),
    notes: { userId, packId, type: "credits" },
  });

  await collections.payments().insertOne({
    _id: crypto.randomUUID(),
    userId,
    razorpayOrderId: order.id,
    amount: pack.amount,
    currency: "INR",
    type: "credits",
    creditsGranted: pack.credits,
    packId,
    status: "created",
    createdAt: new Date(),
  });

  return { orderId: order.id, amount: order.amount, currency: order.currency, key: env.RAZORPAY_KEY_ID, pack };
}

export async function createSubscriptionOrder(userId, planId, email) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) throw new ApiError(400, "INVALID_PLAN", "Invalid subscription plan");

  const rzpPlanId = plan.planId || (planId === "pro_monthly" ? env.RAZORPAY_PLAN_PRO_MONTHLY : env.RAZORPAY_PLAN_PRO_YEARLY);

  // Try creating recurring Razorpay subscription first
  try {
    const customerId = await getOrCreateRazorpayCustomer(userId, email);

    const subscription = await razorpay.subscriptions.create({
      plan_id: rzpPlanId,
      customer_id: customerId,
      total_count: plan.interval === "monthly" ? 12 : 1,
      quantity: 1,
      customer_notify: 1,
      notes: { userId, planId },
    });

    await collections.payments().insertOne({
      _id: crypto.randomUUID(),
      userId,
      razorpayOrderId: subscription.id,
      razorpaySubscriptionId: subscription.id,
      amount: plan.amount,
      currency: "INR",
      type: "subscription",
      planId,
      status: "created",
      createdAt: new Date(),
    });

    return {
      subscriptionId: subscription.id,
      amount: plan.amount,
      currency: "INR",
      key: env.RAZORPAY_KEY_ID,
      plan,
    };
  } catch (subErr) {
    logger.warn({ err: subErr.message }, "Razorpay subscription creation failed, falling back to standard order");

    // Seamless fallback to standard one-time order for Pro plan access
    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: "INR",
      receipt: `sub_${userId}_${Date.now()}`.slice(0, 40),
      notes: { userId, planId, type: "subscription" },
    });

    await collections.payments().insertOne({
      _id: crypto.randomUUID(),
      userId,
      razorpayOrderId: order.id,
      amount: plan.amount,
      currency: "INR",
      type: "subscription",
      planId,
      status: "created",
      createdAt: new Date(),
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.RAZORPAY_KEY_ID,
      plan,
    };
  }
}

export async function verifyPaymentAndGrant(userId, { razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, razorpay_signature }) {
  const isSubscription = Boolean(razorpay_subscription_id);

  if (isSubscription) {
    if (!verifyRazorpaySubscriptionSignature(razorpay_subscription_id, razorpay_payment_id, razorpay_signature)) {
      throw new ApiError(400, "INVALID_SIGNATURE", "Subscription signature verification failed");
    }
  } else {
    if (!verifyRazorpayOrderSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      throw new ApiError(400, "INVALID_SIGNATURE", "Payment signature verification failed");
    }
  }

  const query = isSubscription
    ? { razorpaySubscriptionId: razorpay_subscription_id }
    : { razorpayOrderId: razorpay_order_id };

  const payment = await collections.payments().findOne(query);
  if (!payment) throw new ApiError(404, "ORDER_NOT_FOUND", "Order or subscription record not found");
  if (payment.userId !== userId) throw new ApiError(403, "FORBIDDEN", "Payment record does not belong to user");
  if (payment.status === "paid") return { alreadyProcessed: true, payment };

  await collections.payments().updateOne(
    { _id: payment._id },
    {
      $set: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
        paidAt: new Date(),
      },
    }
  );

  if (payment.type === "credits") {
    await grantCredits(userId, payment.creditsGranted, payment._id, `Credit pack: ${payment.packId}`);
  } else if (payment.type === "subscription") {
    await activateSubscription(userId, payment.planId, payment.razorpaySubscriptionId || razorpay_subscription_id || payment.razorpayOrderId);
  }

  return { alreadyProcessed: false, payment };
}

async function grantCredits(userId, amount, referenceId, description) {
  const user = await collections.users().findOneAndUpdate(
    { _id: userId },
    { $inc: { credits: amount } },
    { returnDocument: "after" }
  );

  const balanceAfter = user?.credits ?? amount;

  await collections.creditTransactions().insertOne({
    _id: crypto.randomUUID(),
    userId,
    amount,
    type: "purchase",
    referenceId,
    description,
    balanceAfter,
    createdAt: new Date(),
  });

  logger.info({ userId, amount, balance: balanceAfter }, "Credits granted");
  return balanceAfter;
}

async function activateSubscription(userId, planId, razorpaySubscriptionId) {
  const plan = SUBSCRIPTION_PLANS[planId];
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + (plan.interval === "monthly" ? 1 : 12));

  await collections.users().updateOne(
    { _id: userId },
    {
      $set: {
        "subscription.planId": planId,
        "subscription.status": "active",
        "subscription.currentPeriodEnd": periodEnd,
        "subscription.razorpaySubscriptionId": razorpaySubscriptionId,
      },
    }
  );

  logger.info({ userId, planId, periodEnd }, "Subscription activated");
}

export async function deductCredit(userId, sessionId, description = "PDF upload / chat session") {
  let user = await collections.users().findOne({ _id: userId });
  if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found");

  const hasActiveSubscription =
    user.subscription?.status === "active" &&
    user.subscription?.currentPeriodEnd &&
    new Date(user.subscription.currentPeriodEnd) > new Date();

  if (hasActiveSubscription) return { success: true, subscription: true };

  if (user.credits === undefined) {
    await collections.users().updateOne({ _id: userId }, { $set: { credits: 3 } });
    user.credits = 3;
  }

  const credits = user.credits ?? 0;
  if (credits < 1) {
    throw new ApiError(402, "INSUFFICIENT_CREDITS", "You have used all your 3 free credits. Please subscribe to Pro or purchase a credit pack to continue.");
  }

  const updated = await collections.users().findOneAndUpdate(
    { _id: userId, credits: { $gte: 1 } },
    { $inc: { credits: -1 } },
    { returnDocument: "after" }
  );

  if (!updated) throw new ApiError(409, "CREDITS_CHANGED", "Credits changed, please retry");

  await collections.creditTransactions().insertOne({
    _id: crypto.randomUUID(),
    userId,
    amount: -1,
    type: "usage",
    referenceId: sessionId,
    description,
    balanceAfter: updated.credits,
    createdAt: new Date(),
  });

  return { success: true, subscription: false, creditsRemaining: updated.credits };
}

export async function getUserCredits(userId) {
  let user = await collections.users().findOne(
    { _id: userId },
    { projection: { credits: 1, subscription: 1 } }
  );
  if (!user) {
    return {
      credits: 0,
      subscription: { status: "inactive" },
      isPro: false,
      plan: "free",
      planLabel: "Free Account",
    };
  }
  if (user.credits === undefined) {
    await collections.users().updateOne({ _id: userId }, { $set: { credits: 3 } });
    user.credits = 3;
  }
  const isPro = Boolean(
    user?.subscription?.status === "active" &&
    user?.subscription?.currentPeriodEnd &&
    new Date(user.subscription.currentPeriodEnd) > new Date()
  );
  return {
    credits: user?.credits ?? 0,
    subscription: user?.subscription || { status: "inactive" },
    isPro,
    plan: isPro ? (user?.subscription?.planId || "pro_monthly") : "free",
    planLabel: isPro
      ? (user?.subscription?.planId === "pro_yearly" ? "Pro Yearly" : "Pro Monthly")
      : "Free Account",
  };
}

export async function getPaymentHistory(userId) {
  const payments = await collections.payments()
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return payments;
}

export async function getCreditTransactions(userId) {
  const transactions = await collections.creditTransactions()
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return transactions;
}

export function verifyWebhookSignature(payload, signature) {
  if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  const expectedBuf = Buffer.from(expectedSignature);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export async function handleWebhookEvent(event) {
  const { event: eventType, payload } = event;
  const paymentEntity = payload.payment?.entity;
  const subscriptionEntity = payload.subscription?.entity;

  logger.info({ eventType, paymentId: paymentEntity?.id, subscriptionId: subscriptionEntity?.id }, "Webhook received");

  switch (eventType) {
    case "payment.captured": {
      if (!paymentEntity) break;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const payment = await collections.payments().findOne({ razorpayOrderId: orderId });
      if (!payment) {
        logger.warn({ orderId }, "Payment record not found for captured payment");
        break;
      }

      if (payment.status === "paid") {
        logger.info({ paymentId }, "Payment already processed");
        break;
      }

      await collections.payments().updateOne(
        { _id: payment._id },
        {
          $set: {
            razorpayPaymentId: paymentId,
            status: "paid",
            paidAt: new Date(),
          },
        }
      );

      if (payment.type === "credits") {
        await grantCredits(payment.userId, payment.creditsGranted, payment._id, `Credit pack: ${payment.packId}`);
      } else if (payment.type === "subscription") {
        await activateSubscription(payment.userId, payment.planId, payment.razorpaySubscriptionId);
      }
      break;
    }

    case "payment.failed": {
      if (!paymentEntity) break;
      const orderId = paymentEntity.order_id;
      await collections.payments().updateOne(
        { razorpayOrderId: orderId },
        { $set: { status: "failed", paidAt: new Date() } }
      );
      logger.info({ orderId }, "Payment marked as failed");
      break;
    }

    case "subscription.charged": {
      if (!subscriptionEntity) break;
      const subId = subscriptionEntity.id;
      const paymentId = subscriptionEntity.charge_id;

      const payment = await collections.payments().findOne({ razorpaySubscriptionId: subId });
      if (!payment) break;

      await collections.payments().insertOne({
        _id: crypto.randomUUID(),
        userId: payment.userId,
        razorpayOrderId: paymentId,
        razorpayPaymentId: paymentId,
        razorpaySubscriptionId: subId,
        amount: subscriptionEntity.amount,
        currency: "INR",
        type: "subscription",
        planId: payment.planId,
        status: "paid",
        paidAt: new Date(),
        createdAt: new Date(),
      });

      const plan = SUBSCRIPTION_PLANS[payment.planId];
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + (plan?.interval === "monthly" ? 1 : 12));

      await collections.users().updateOne(
        { _id: payment.userId },
        { $set: { "subscription.currentPeriodEnd": periodEnd, "subscription.status": "active" } }
      );
      logger.info({ userId: payment.userId, subId }, "Subscription renewed");
      break;
    }

    case "subscription.cancelled": {
      if (!subscriptionEntity) break;
      const subId = subscriptionEntity.id;
      const payment = await collections.payments().findOne({ razorpaySubscriptionId: subId });
      if (!payment) break;

      await collections.users().updateOne(
        { _id: payment.userId },
        { $set: { "subscription.status": "cancelled" } }
      );
      logger.info({ userId: payment.userId, subId }, "Subscription cancelled");
      break;
    }

    case "subscription.paused": {
      if (!subscriptionEntity) break;
      const subId = subscriptionEntity.id;
      const payment = await collections.payments().findOne({ razorpaySubscriptionId: subId });
      if (!payment) break;

      await collections.users().updateOne(
        { _id: payment.userId },
        { $set: { "subscription.status": "paused" } }
      );
      break;
    }

    case "subscription.resumed": {
      if (!subscriptionEntity) break;
      const subId = subscriptionEntity.id;
      const payment = await collections.payments().findOne({ razorpaySubscriptionId: subId });
      if (!payment) break;

      await collections.users().updateOne(
        { _id: payment.userId },
        { $set: { "subscription.status": "active" } }
      );
      break;
    }

    case "refund.processed": {
      if (!paymentEntity) break;
      const orderId = paymentEntity.order_id;
      const payment = await collections.payments().findOne({ razorpayOrderId: orderId });
      if (!payment) break;

      await collections.payments().updateOne(
        { _id: payment._id },
        { $set: { status: "refunded" } }
      );

      if (payment.type === "credits") {
        await grantCredits(payment.userId, -payment.creditsGranted, payment._id, `Refund for ${payment.packId}`);
      }
      break;
    }
  }
}