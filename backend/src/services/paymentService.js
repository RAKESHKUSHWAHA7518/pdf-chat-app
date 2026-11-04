// src/services/paymentService.js — Razorpay payment processing, credits, subscriptions.
import crypto from "node:crypto";
import Razorpay from "razorpay";

import { env } from "../config/env.js";
import { collections, withTransaction } from "../db/database.js";
import { ApiError } from "../middleware/errorHandler.js";
import { logger } from "../lib/logger.js";

let client;
function paymentClient() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw new ApiError(503, "PAYMENTS_DISABLED", "Payments are not configured");
  return client ??= new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

export const CREDIT_PACKS = {
  pack_10: { credits: 10, amount: env.RAZORPAY_CREDITS_PACK_10_AMOUNT, label: "10 PDF Credits" },
  pack_50: { credits: 50, amount: env.RAZORPAY_CREDITS_PACK_50_AMOUNT, label: "50 PDF Credits" },
  pack_100: { credits: 100, amount: env.RAZORPAY_CREDITS_PACK_100_AMOUNT, label: "100 PDF Credits" },
};

export const SUBSCRIPTION_PLANS = {
  pro_monthly: {
    planId: env.RAZORPAY_PLAN_PRO_MONTHLY,
    amount: env.RAZORPAY_PRO_MONTHLY_AMOUNT,
    interval: "monthly",
    label: "Pro Monthly",
    price: "₹299/mo",
  },
  pro_yearly: {
    planId: env.RAZORPAY_PLAN_PRO_YEARLY,
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

  const customer = await paymentClient().customers.create({
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
  const pack = Object.hasOwn(CREDIT_PACKS, packId) && CREDIT_PACKS[packId];
  if (!pack) throw new ApiError(400, "INVALID_PACK", "Invalid credit pack");

  const order = await paymentClient().orders.create({
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
  const plan = Object.hasOwn(SUBSCRIPTION_PLANS, planId) && SUBSCRIPTION_PLANS[planId];
  if (!plan) throw new ApiError(400, "INVALID_PLAN", "Invalid subscription plan");

  const rzpPlanId = plan.planId || (planId === "pro_monthly" ? env.RAZORPAY_PLAN_PRO_MONTHLY : env.RAZORPAY_PLAN_PRO_YEARLY);

  if (!rzpPlanId) throw new ApiError(503, "PLAN_NOT_CONFIGURED", "This subscription is not configured");
  const customerId = await getOrCreateRazorpayCustomer(userId, email);
  const subscription = await paymentClient().subscriptions.create({ plan_id: rzpPlanId, customer_id: customerId, total_count: plan.interval === "monthly" ? 12 : 1, quantity: 1, customer_notify: 1, notes: { userId, planId } });
  await collections.payments().insertOne({ _id: crypto.randomUUID(), userId, razorpaySubscriptionId: subscription.id, amount: plan.amount, currency: "INR", type: "subscription", planId, status: "created", createdAt: new Date() });
  return { subscriptionId: subscription.id, amount: plan.amount, currency: "INR", key: env.RAZORPAY_KEY_ID, plan };
}


// All monetary mutations run in a MongoDB transaction (Atlas or a replica set).
// A unique ledger key serializes concurrent checkout and webhook deliveries.
export async function settlePayment(paymentId, entity, subscriptionEntity = null, session) {
  if (!entity || entity.status !== "captured") throw new ApiError(409, "PAYMENT_PENDING", "Payment is not captured yet");
  const record = await collections.payments().findOne({ _id: paymentId }, { session });
  if (!record) throw new ApiError(404, "ORDER_NOT_FOUND", "Payment record not found");
  if (entity.amount !== record.amount || entity.currency !== record.currency) throw new ApiError(400, "PAYMENT_MISMATCH", "Payment amount or currency does not match");
  if (record.type === "credits" && entity.order_id !== record.razorpayOrderId) throw new ApiError(400, "PAYMENT_MISMATCH", "Payment order does not match");
  const key = "payment:" + entity.id;
  if (await collections.creditTransactions().findOne({ _id: key }, { session })) return { alreadyProcessed: true, payment: record };
  if (record.type === "credits" && ["paid", "refunded"].includes(record.status)) return { alreadyProcessed: true, payment: record };
  let update;
  if (record.type === "credits") update = { $inc: { credits: record.creditsGranted } };
  else {
    if (!subscriptionEntity?.current_end) throw new ApiError(409, "SUBSCRIPTION_PENDING", "Subscription period is not available yet");
    update = { $set: { "subscription.planId": record.planId, "subscription.status": subscriptionEntity.status, "subscription.razorpaySubscriptionId": record.razorpaySubscriptionId }, $max: { "subscription.currentPeriodEnd": new Date(subscriptionEntity.current_end * 1000) } };
  }
  const user = await collections.users().findOneAndUpdate({ _id: record.userId }, update, { session, returnDocument: "after" });
  if (!user) throw new ApiError(404, "USER_NOT_FOUND", "Account not found");
  await collections.creditTransactions().insertOne({ _id: key, userId: record.userId, amount: record.type === "credits" ? record.creditsGranted : 0, type: "purchase", referenceId: record._id, paymentId: entity.id, balanceAfter: user.credits, createdAt: new Date() }, { session });
  await collections.payments().updateOne({ _id: record._id }, { $set: { status: "paid", razorpayPaymentId: entity.id, paidAt: new Date() } }, { session });
  return { alreadyProcessed: false, payment: record };
}

export async function verifyPaymentAndGrant(userId, data) {
  const { razorpay_order_id: orderId, razorpay_subscription_id: subId, razorpay_payment_id: paymentId, razorpay_signature: signature } = data;
  if (![paymentId, signature, subId || orderId].every(v => typeof v === "string")) throw new ApiError(400, "INVALID_PAYMENT", "Invalid verification fields");
  const valid = subId ? verifyRazorpaySubscriptionSignature(subId, paymentId, signature) : verifyRazorpayOrderSignature(orderId, paymentId, signature);
  if (!valid) throw new ApiError(400, "INVALID_SIGNATURE", "Payment verification failed");
  const record = await collections.payments().findOne(subId ? { razorpaySubscriptionId: subId } : { razorpayOrderId: orderId });
  if (!record || record.userId !== userId) throw new ApiError(404, "ORDER_NOT_FOUND", "Payment record not found");
  const entity = await paymentClient().payments.fetch(paymentId);
  const subscription = subId ? await paymentClient().subscriptions.fetch(subId) : null;
  return withTransaction(session => settlePayment(record._id, entity, subscription, session));
}

export async function deductCredit(userId, referenceId, description = "AI operation") {
  return withTransaction(async session => {
    const user = await collections.users().findOne({ _id: userId }, { session });
    if (!user) throw new ApiError(401, "AUTH_REQUIRED", "Account not found");
    const subscription = user.subscription?.status === "active" && new Date(user.subscription.currentPeriodEnd) > new Date();
    const operationId = crypto.randomUUID();
    const updated = subscription ? user : await collections.users().findOneAndUpdate({ _id: userId, credits: { $gte: 1 } }, { $inc: { credits: -1 } }, { session, returnDocument: "after" });
    if (!updated) throw new ApiError(402, "INSUFFICIENT_CREDITS", "Please purchase credits to continue");
    await collections.operations().insertOne({ _id: operationId, userId, charged: !subscription, status: "reserved", description, referenceId, createdAt: new Date() }, { session });
    await collections.creditTransactions().insertOne({ _id: "usage:" + operationId, userId, amount: subscription ? 0 : -1, type: "usage", referenceId, description, balanceAfter: updated.credits, createdAt: new Date() }, { session });
    return { success: true, subscription: Boolean(subscription), creditsRemaining: updated.credits, operationId };
  });
}

export async function completeOperation(operationId) {
  if (operationId) await collections.operations().updateOne({ _id: operationId, status: "reserved" }, { $set: { status: "completed", completedAt: new Date() } });
}

export async function refundOperation(operationId) {
  if (!operationId) return;
  return withTransaction(async session => {
    const operation = await collections.operations().findOneAndUpdate({ _id: operationId, status: "reserved" }, { $set: { status: "refunded" } }, { session, returnDocument: "before" });
    if (!operation?.charged) return;
    const user = await collections.users().findOneAndUpdate({ _id: operation.userId }, { $inc: { credits: 1 } }, { session, returnDocument: "after" });
    await collections.creditTransactions().insertOne({ _id: "refund:" + operationId, userId: operation.userId, amount: 1, type: "usage_refund", referenceId: operationId, balanceAfter: user?.credits, createdAt: new Date() }, { session });
  });
}

// Recover abandoned operations after crashes. The grace period exceeds the AI request timeout.
export async function recoverAbandonedOperations() {
  const stale = await collections.operations().find({ status: "reserved", createdAt: { $lt: new Date(Date.now() - Math.max(env.AI_TIMEOUT_MS * 3, 30 * 60000)) } }).limit(100).toArray();
  for (const operation of stale) {
    const document = await collections.userDocuments().findOne({ sessionId: operation.referenceId, userId: operation.userId });
    if (document) {
      await collections.documents().updateMany({ sessionId: operation.referenceId }, { $unset: { expiresAt: "" } });
      await completeOperation(operation._id);
    } else await refundOperation(operation._id);
  }
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
  if (!Buffer.isBuffer(payload) || typeof signature !== "string" || !env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(payload).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function handleWebhookEvent(event, eventId) {
  if (typeof eventId !== "string" || !eventId || !event?.payload) throw new ApiError(400, "INVALID_EVENT", "Missing event identity");
  const entity = event.payload.payment?.entity;
  const sub = event.payload.subscription?.entity;
  // Fetch authoritative subscription state to avoid regressing on out-of-order events.
  const currentSub = sub?.id ? await paymentClient().subscriptions.fetch(sub.id) : null;
  return withTransaction(async session => {
    if (await collections.webhookEvents().findOne({ _id: eventId }, { session })) return;
    if (event.event === "payment.captured" || event.event === "subscription.charged") {
      if (!entity) throw new ApiError(400, "INVALID_EVENT", "Missing payment");
      const record = await collections.payments().findOne(sub ? { razorpaySubscriptionId: sub.id } : { razorpayOrderId: entity.order_id }, { session });
      // Subscription captures may precede subscription.charged; that event handles the grant.
      if (!record && await collections.creditTransactions().findOne({ _id: "payment:" + entity.id }, { session })) {
        await collections.webhookEvents().insertOne({ _id: eventId, type: event.event, processedAt: new Date() }, { session });
        return;
      }
      if (!record) throw new ApiError(409, "ORDER_PENDING", "Order has not been recorded yet");
      await settlePayment(record._id, entity, currentSub, session);
    } else if (event.event === "payment.failed" && entity) {
      await collections.payments().updateOne({ razorpayOrderId: entity.order_id, status: "created" }, { $set: { status: "failed" } }, { session });
    } else if (event.event.startsWith("subscription.") && currentSub) {
      const record = await collections.payments().findOne({ razorpaySubscriptionId: currentSub.id }, { session });
      if (!record) throw new ApiError(409, "ORDER_PENDING", "Subscription has not been recorded yet");
      const fields = { "subscription.status": currentSub.status };
      if (currentSub.current_end) fields["subscription.currentPeriodEnd"] = new Date(currentSub.current_end * 1000);
      await collections.users().updateOne({ _id: record.userId, "subscription.razorpaySubscriptionId": currentSub.id }, { $set: fields }, { session });
    } else if (event.event === "refund.processed") {
      const refund = event.payload.refund?.entity;
      if (!refund?.id || !refund.payment_id) throw new ApiError(400, "INVALID_EVENT", "Missing refund");
      const key = "provider-refund:" + refund.id;
      if (!(await collections.creditTransactions().findOne({ _id: key }, { session }))) {
        const purchase = await collections.creditTransactions().findOne({ _id: "payment:" + refund.payment_id }, { session });
        const record = purchase
          ? await collections.payments().findOne({ _id: purchase.referenceId }, { session })
          : await collections.payments().findOne({ razorpayPaymentId: refund.payment_id, status: { $in: ["paid", "refunded"] } }, { session });
        if (!record) throw new ApiError(409, "PAYMENT_PENDING", "Original payment has not been processed");
        const previous = record.refundedAmount || 0;
        const total = Math.min(record.amount, previous + refund.amount);
        const removal = record.type === "credits" ? Math.floor(total * record.creditsGranted / record.amount) - Math.floor(previous * record.creditsGranted / record.amount) : 0;
        await collections.users().updateOne({ _id: record.userId }, record.type === "credits" ? { $inc: { credits: -removal } } : { $set: { "subscription.status": "refunded" } }, { session });
        await collections.payments().updateOne({ _id: record._id }, { $set: { refundedAmount: total, status: total === record.amount ? "refunded" : "paid" } }, { session });
        await collections.creditTransactions().insertOne({ _id: key, userId: record.userId, amount: -removal, type: "refund", referenceId: refund.payment_id, createdAt: new Date() }, { session });
      }
    }
    await collections.webhookEvents().insertOne({ _id: eventId, type: event.event, processedAt: new Date() }, { session });
  });
}
