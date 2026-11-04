import crypto from "node:crypto";
import { env } from "../config/env.js";
import { collections, withTransaction } from "../db/database.js";
import { ApiError } from "../middleware/errorHandler.js";
export async function getGuestQuota(guestId) {
  const doc = guestId ? await collections.guestUsage().findOne({ _id: guestId }) : null;
  const used = doc?.uploadsUsed || 0;
  return { used, limit: env.GUEST_FREE_UPLOADS, remaining: guestId ? Math.max(0, env.GUEST_FREE_UPLOADS - used) : 0 };
}
export async function reserveGuestUpload(guestId, ip) {
  if (!guestId) throw new ApiError(403, "AUTH_REQUIRED", "Enable cookies or sign in to upload");
  const ipKey = "ip:" + crypto.createHmac("sha256", env.JWT_SECRET).update(String(ip) + new Date().toISOString().slice(0,10)).digest("hex");
  return withTransaction(async session => {
    for (const [key, limit] of [[guestId, env.GUEST_FREE_UPLOADS], [ipKey, 5]]) {
      await collections.guestUsage().updateOne({ _id: key }, { $setOnInsert: { uploadsUsed: 0, createdAt: new Date() } }, { upsert: true, session });
      const result = await collections.guestUsage().updateOne({ _id: key, uploadsUsed: { $lt: limit } }, { $inc: { uploadsUsed: 1 } }, { session });
      if (!result.modifiedCount) throw new ApiError(403, "AUTH_REQUIRED", "Trial quota used. Please sign in");
    }
    return { guestId, ipKey };
  });
}
export async function refundGuestUpload(reservation) {
  if (!reservation) return;
  await withTransaction(async session => {
    for (const key of [reservation.guestId, reservation.ipKey]) await collections.guestUsage().updateOne({ _id: key, uploadsUsed: { $gt: 0 } }, { $inc: { uploadsUsed: -1 } }, { session });
  });
}
