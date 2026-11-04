// src/services/authService.js — Account creation, login, JWT issuing/verification.
// Passwords are hashed with Node's built-in scrypt (memory-hard KDF),
// stored as "salt:hash". Constant-time comparison prevents timing attacks.
import crypto from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(crypto.scrypt);
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { collections, withTransaction } from "../db/database.js";
import { ApiError } from "../middleware/errorHandler.js";

const SCRYPT_KEYLEN = 64;
const TOKEN_TTL = "7d";

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, SCRYPT_KEYLEN)).toString("hex");
  return `${salt}:${hash}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const candidate = await scrypt(password, salt, SCRYPT_KEYLEN);
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: TOKEN_TTL, issuer: "devsuite-v2", audience: "devsuite-api", algorithm: "HS256" });
}

export async function signup(email, password) {
  const normalizedEmail = email.toLowerCase();
  const existing = await collections.users().findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  try { await withTransaction(async session => {
  await collections.users().insertOne({
    _id: id,
    email: normalizedEmail,
    passwordHash,
    credits: 3, // 3 free credits upon signup
    subscription: { status: "inactive" },
    createdAt: new Date(),
  }, { session });

  await collections.creditTransactions().insertOne({
    _id: crypto.randomUUID(),
    userId: id,
    amount: 3,
    type: "welcome_bonus",
    description: "Welcome bonus: 3 free document credits",
    balanceAfter: 3,
    createdAt: new Date(),
  });

  }); } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
    throw err;
  }

  return {
    token: signToken(id),
    user: { id, email: normalizedEmail, isPro: false, plan: "free", credits: 3 },
  };
}

export async function login(email, password) {
  let user = await collections.users().findOne({ email: email.toLowerCase() });
  // Same error for unknown email and wrong password — don't leak which is which
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  if (user.credits === undefined) {
    await collections.users().updateOne({ _id: user._id }, { $set: { credits: 3 } });
    user.credits = 3;
  }
  const isPro = Boolean(
    user?.subscription?.status === "active" &&
    user?.subscription?.currentPeriodEnd &&
    new Date(user.subscription.currentPeriodEnd) > new Date()
  );
  return {
    token: signToken(user._id),
    user: {
      id: user._id,
      email: user.email,
      isPro,
      plan: isPro ? (user?.subscription?.planId || "pro_monthly") : "free",
      credits: user.credits,
    },
  };
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"], issuer: "devsuite-v2", audience: "devsuite-api" });
    return payload.sub;
  } catch {
    return null;
  }
}

export async function getUserById(id) {
  let user = await collections.users().findOne(
    { _id: id },
    { projection: { _id: 1, email: 1, credits: 1, subscription: 1, createdAt: 1 } }
  );
  if (!user) return null;
  if (user.credits === undefined) {
    await collections.users().updateOne({ _id: id }, { $set: { credits: 3 } });
    user.credits = 3;
  }
  const isPro = Boolean(
    user?.subscription?.status === "active" &&
    user?.subscription?.currentPeriodEnd &&
    new Date(user.subscription.currentPeriodEnd) > new Date()
  );
  return {
    ...user,
    isPro,
    plan: isPro ? (user?.subscription?.planId || "pro_monthly") : "free",
  };
}
