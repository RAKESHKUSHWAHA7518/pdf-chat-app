// src/middleware/auth.js — Authentication middleware.
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { verifyToken } from "../services/authService.js";
import { ApiError } from "./errorHandler.js";

/**
 * Attaches req.userId when a valid Bearer token is present.
 * Invalid/expired tokens are treated as anonymous (never throws).
 */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    req.userId = verifyToken(header.slice(7));
    if (!req.userId) return next(new ApiError(401, "AUTH_REQUIRED", "Please sign in again"));
  }
  next();
}

/** Rejects anonymous requests with 401. Use on protected routes. */
export function requireAuth(req, res, next) {
  if (!req.userId) {
    return next(new ApiError(401, "AUTH_REQUIRED", "Authentication required"));
  }
  next();
}

/** Client-generated UUID identifying anonymous trial users. */
export function getGuestId(req) { return req.guestId || null; }

export function guestIdentity(req, res, next) {
  const cookie = (req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith("guest_session="))?.slice(14);
  try {
    req.guestId = jwt.verify(cookie, env.JWT_SECRET, { algorithms: ["HS256"], audience: "guest", issuer: "devsuite-v2" }).sub;
  } catch {
    req.guestId = crypto.randomUUID();
    const token = jwt.sign({}, env.JWT_SECRET, { subject: req.guestId, audience: "guest", issuer: "devsuite-v2", expiresIn: "30d" });
    res.cookie("guest_session", token, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 86400000, path: "/api" });
  }
  next();
}
