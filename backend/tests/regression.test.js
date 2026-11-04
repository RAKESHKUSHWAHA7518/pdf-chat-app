import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import jwt from "jsonwebtoken";

Object.assign(process.env, { NODE_ENV: "test", JWT_SECRET: "isolated-regression-secret-at-least-32-characters", GEMINI_API_KEY: "unused-test-key", RAZORPAY_KEY_ID: "rzp_test_unused", RAZORPAY_KEY_SECRET: "unused-test-secret", RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret", GITHUB_TOKEN_KEY: "ab".repeat(32), PUBLIC_URL: "http://localhost:3001", CORS_ORIGIN: "https://allowed.example", LOG_LEVEL: "fatal", RATE_LIMIT_MAX: "1000", MONGODB_DB: "isolated_regression" });
let mongo, server, base, db, payment, access, oauth, sessions, guest, auth;
const userA = "user-a", userB = "user-b";
const token = user => jwt.sign({}, process.env.JWT_SECRET, { subject: user, issuer: "devsuite-v2", audience: "devsuite-api", expiresIn: "1h" });
const request = (path, options = {}) => fetch(base + path, { ...options, signal: AbortSignal.timeout(10000) });
const headers = user => ({ Authorization: "Bearer " + token(user), "Content-Type": "application/json" });
before(async () => {
  console.log("Starting isolated replica set");
  mongo = await MongoMemoryReplSet.create({ instanceOpts: [{ launchTimeout: 60000, args: ["--wiredTigerCacheSizeGB", "0.25"] }], replSet: { count: 1, storageEngine: "wiredTiger", configSettings: { electionTimeoutMillis: 1000 } } });
  console.log("Replica set ready");
  process.env.MONGODB_URI = mongo.getUri();
  db = await import("../src/db/database.js");
  await db.connectDatabase(); await db.ensureIndexes();
  console.log("Database ready");
  payment = await import("../src/services/paymentService.js");
  access = await import("../src/services/documentAccess.js");
  oauth = await import("../src/services/oauthService.js");
  guest = await import("../src/services/guestService.js");
  auth = await import("../src/services/authService.js");
  sessions = (await import("../src/services/sessionService.js")).sessionService;
  await db.collections.users().insertMany([{ _id: userA, email: "a@example.test", credits: 30 }, { _id: userB, email: "b@example.test", credits: 30 }]);
  console.log("Loading application");
  const app = (await import("../src/app.js")).createApp();
  server = await new Promise(resolve => { const handle = app.listen(0, "127.0.0.1", () => resolve(handle)); });
  base = "http://127.0.0.1:" + server.address().port;
  console.log("Local test server ready");
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  sessions?.shutdown();
  await db?.closeDatabase();
  await mongo?.stop();
});

test("old embedded and unscoped tokens are rejected", async () => {
  const old = jwt.sign({ sub: userA }, process.env.JWT_SECRET);
  assert.equal(auth.verifyToken(old), null);
  assert.equal(auth.verifyToken(token(userA)), userA);
  assert.equal((await request("/api/auth/me", { headers: { Authorization: "Bearer " + old } })).status, 401);
});
test("signup and login use the new token boundary", async () => {
  const result = await auth.signup("new@example.test", "Strong-test-password1");
  assert.equal(auth.verifyToken(result.token), result.user.id);
  assert.equal((await auth.login("new@example.test", "Strong-test-password1")).user.email, "new@example.test");
  await assert.rejects(auth.login("new@example.test", "wrong-password"), { code: "INVALID_CREDENTIALS" });
  await assert.rejects(auth.signup("new@example.test", "Strong-test-password1"), { code: "EMAIL_TAKEN" });
});
test("CORS only echoes configured origins and CSP blocks inline scripts", async () => {
  const denied = await request("/api/payments/credits/packs", { headers: { Origin: "https://untrusted.example" } });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
  assert.match(denied.headers.get("content-security-policy"), /script-src 'self' https:\/\/checkout.razorpay.com/);
  const allowed = await request("/api/payments/credits/packs", { headers: { Origin: "https://allowed.example" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "https://allowed.example");
});
test("owned document cannot be chatted with or deleted by another user or guest", async () => {
  const id = crypto.randomUUID();
  await db.collections.userDocuments().insertOne({ sessionId: id, userId: userA, history: [] });
  sessions.create(id, { userId: userA, history: [], ragChain: { async *stream() { yield "Synthetic answer"; } } });
  for (const caller of [undefined, userB]) {
    const h = caller ? headers(caller) : { "Content-Type": "application/json" };
    assert.equal((await request("/api/chat", { method: "POST", headers: h, body: JSON.stringify({ sessionId: id, question: "What?" }) })).status, 404);
    assert.equal((await request("/api/session/" + id, { method: "DELETE", headers: h })).status, 404);
  }
  const result = await request("/api/chat", { method: "POST", headers: headers(userA), body: JSON.stringify({ sessionId: id, question: "What?" }) });
  assert.equal(result.status, 200); assert.match(await result.text(), /Synthetic answer/);
  const doc = await db.collections.userDocuments().findOne({ sessionId: id });
  assert.equal(doc.history.length, 2); assert.equal(doc.busyUntil, undefined);
});
test("restoration never assigns an existing document to the caller", async () => {
  const id = crypto.randomUUID();
  await db.collections.userDocuments().insertOne({ sessionId: id, userId: userA });
  await assert.rejects(access.authorizeDocument({ userId: userB }, id), { code: "DOCUMENT_NOT_FOUND" });
  assert.equal((await access.authorizeDocument({ userId: userA }, id)).userId, userA);
});
test("career document extraction checks ownership before reading chunks", async () => {
  const service = await import("../src/services/careerService.js");
  const id = crypto.randomUUID();
  await db.collections.userDocuments().insertOne({ sessionId: id, userId: userA });
  await db.collections.documents().insertOne({ sessionId: id, text: "Private resume" });
  await assert.rejects(service.extractTextFromSession(id, userB), { code: "DOCUMENT_NOT_FOUND" });
  assert.equal(await service.extractTextFromSession(id, userA), "Private resume");
});
test("guest identity is signed, HttpOnly, and ignores client-selected headers", async () => {
  const response = await request("/api/auth/me", { headers: { "x-guest-id": "attacker-selected" } });
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Lax/);
  const encoded = cookie.split(";")[0].slice("guest_session=".length);
  const identity = jwt.verify(encoded, process.env.JWT_SECRET, { audience: "guest", issuer: "devsuite-v2" });
  assert.notEqual(identity.sub, "attacker-selected");
  const id = crypto.randomUUID();
  sessions.create(id, { guestId: identity.sub, history: [] });
  await assert.rejects(access.authorizeDocument({ guestId: "other" }, id), { code: "DOCUMENT_NOT_FOUND" });
  assert.equal((await access.authorizeDocument({ guestId: identity.sub }, id)).guestId, identity.sub);
});
test("trial reservation is atomic and missing identity is rejected", async () => {
  await assert.rejects(guest.reserveGuestUpload(null, "127.0.0.1"), { code: "AUTH_REQUIRED" });
  const id = crypto.randomUUID();
  const results = await Promise.allSettled([guest.reserveGuestUpload(id, "192.0.2.1"), guest.reserveGuestUpload(id, "192.0.2.1")]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal((await guest.getGuestQuota(id)).remaining, 0);
});
test("AI endpoints require authentication and validate before spending", async () => {
  for (const path of ["generate-diagram", "ats-scan"]) assert.equal((await request("/api/career/" + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 401);
  const before = (await db.collections.users().findOne({ _id: userA })).credits;
  const response = await request("/api/career/generate-diagram", { method: "POST", headers: headers(userA), body: "{}" });
  assert.equal(response.status, 400);
  assert.equal((await db.collections.users().findOne({ _id: userA })).credits, before);
});
test("invalid PDF is rejected without spending credits", async () => {
  const form = new FormData(); form.append("pdf", new Blob(["not PDF"], { type: "application/pdf" }), "fake.pdf");
  const response = await request("/api/upload", { method: "POST", headers: { Authorization: "Bearer " + token(userA) }, body: form });
  assert.equal(response.status, 400); assert.equal((await response.json()).error.code, "INVALID_PDF");
});
test("OAuth state is browser-bound, expiring and single-use", async () => {
  const state = await oauth.createOAuthState(userA);
  await assert.rejects(oauth.consumeOAuthState(state.state, "wrong-browser"), { code: "INVALID_OAUTH_STATE" });
  assert.equal(await oauth.consumeOAuthState(state.state, state.browserSecret), userA);
  await assert.rejects(oauth.consumeOAuthState(state.state, state.browserSecret), { code: "INVALID_OAUTH_STATE" });
  const expired = await oauth.createOAuthState(userA);
  await db.collections.oauthStates().updateMany({}, { $set: { expiresAt: new Date(0) } });
  await assert.rejects(oauth.consumeOAuthState(expired.state, expired.browserSecret), { code: "INVALID_OAUTH_STATE" });
});
async function order() {
  const id = crypto.randomUUID(), orderId = "order_" + id, payId = "pay_" + id;
  await db.collections.payments().insertOne({ _id: id, userId: userA, razorpayOrderId: orderId, amount: 29900, currency: "INR", type: "credits", creditsGranted: 10, status: "created" });
  return { id, entity: { id: payId, order_id: orderId, amount: 29900, currency: "INR", status: "captured" } };
}
test("concurrent duplicate payments grant credits once", async () => {
  const { id, entity } = await order();
  const before = (await db.collections.users().findOne({ _id: userA })).credits;
  await Promise.all(Array.from({ length: 4 }, () => db.withTransaction(session => payment.settlePayment(id, entity, null, session))));
  assert.equal((await db.collections.users().findOne({ _id: userA })).credits, before + 10);
  assert.equal(await db.collections.creditTransactions().countDocuments({ _id: "payment:" + entity.id }), 1);
});
test("transaction failure rolls back payment state and credits", async () => {
  const { id, entity } = await order();
  const before = (await db.collections.users().findOne({ _id: userA })).credits;
  await assert.rejects(db.withTransaction(async session => { await payment.settlePayment(id, entity, null, session); throw new Error("simulated crash"); }));
  assert.equal((await db.collections.payments().findOne({ _id: id })).status, "created");
  assert.equal((await db.collections.users().findOne({ _id: userA })).credits, before);
});
test("payment amount mismatch and uncaptured payment do not grant", async () => {
  const { id, entity } = await order();
  await assert.rejects(db.withTransaction(session => payment.settlePayment(id, { ...entity, amount: 1 }, null, session)), { code: "PAYMENT_MISMATCH" });
  await assert.rejects(db.withTransaction(session => payment.settlePayment(id, { ...entity, status: "authorized" }, null, session)), { code: "PAYMENT_PENDING" });
});
test("failed AI operation is refunded once and completed work is not refunded", async () => {
  const service = await import("../src/services/operationService.js");
  const before = (await db.collections.users().findOne({ _id: userA })).credits;
  await assert.rejects(service.runBillable(userA, "test failure", async () => { throw new Error("provider unavailable"); }));
  assert.equal((await db.collections.users().findOne({ _id: userA })).credits, before);
  const done = await service.runBillable(userA, "test success", async () => "ok");
  await payment.refundOperation(done.deduction.operationId);
  assert.equal((await db.collections.users().findOne({ _id: userA })).credits, before - 1);
});
test("abandoned operations are refunded after recovery grace period", async () => {
  const operation = await payment.deductCredit(userA, "abandoned");
  await db.collections.operations().updateOne({ _id: operation.operationId }, { $set: { createdAt: new Date(0) } });
  await payment.recoverAbandonedOperations(); await payment.recoverAbandonedOperations();
  assert.equal((await db.collections.operations().findOne({ _id: operation.operationId })).status, "refunded");
  assert.equal(await db.collections.creditTransactions().countDocuments({ _id: "refund:" + operation.operationId }), 1);
});
test("webhook verifies original bytes, handles duplicates, and retries failures", async () => {
  const { entity } = await order();
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity } } }, null, 2);
  const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
  const options = { method: "POST", headers: { "Content-Type": "application/json", "x-razorpay-signature": signature, "x-razorpay-event-id": "evt_" + entity.id }, body };
  assert.equal((await request("/api/payments/webhook", options)).status, 200);
  assert.equal((await request("/api/payments/webhook", options)).status, 200);
  assert.equal((await request("/api/payments/webhook", { ...options, body: JSON.stringify(JSON.parse(body)) })).status, 400);
  const missing = { ...options, headers: { ...options.headers, "x-razorpay-event-id": "" } };
  assert.equal((await request("/api/payments/webhook", missing)).status, 503);
});
test("refund retries do not deduct credits twice", async () => {
  const { id, entity } = await order();
  await db.withTransaction(session => payment.settlePayment(id, entity, null, session));
  const before = (await db.collections.users().findOne({ _id: userA })).credits;
  const event = { event: "refund.processed", payload: { refund: { entity: { id: "refund_" + id, payment_id: entity.id, amount: 29900 } } } };
  await payment.handleWebhookEvent(event, "refund-event-1-" + id);
  await payment.handleWebhookEvent(event, "refund-event-2-" + id);
  assert.equal((await db.collections.users().findOne({ _id: userA })).credits, before - 10);
});

test("real PDF upload indexes chunks and persists ownership without live AI", async t => {
  const { GeminiEmbeddings } = await import("../src/lib/embeddings.js");
  t.mock.method(GeminiEmbeddings.prototype, "embedDocuments", async texts => texts.map(() => [1, 0, 0]));
  const pdf = await fs.readFile(new URL("../../frontend/public/sample-report.pdf", import.meta.url));
  const form = new FormData(); form.append("pdf", new Blob([pdf], { type: "application/pdf" }), "sample.pdf");
  const before = (await db.collections.users().findOne({ _id: userA })).credits;
  const response = await request("/api/upload", { method: "POST", headers: { Authorization: "Bearer " + token(userA) }, body: form });
  const body = await response.json();
  assert.equal(response.status, 201, JSON.stringify(body));
  assert.ok(body.chunkCount > 0);
  assert.equal((await db.collections.userDocuments().findOne({ sessionId: body.sessionId })).userId, userA);
  assert.equal((await db.collections.users().findOne({ _id: userA })).credits, before - 1);
  assert.equal(await db.collections.documents().countDocuments({ sessionId: body.sessionId, expiresAt: { $exists: true } }), 0);
  assert.equal((await request("/api/documents/" + body.sessionId, { method: "DELETE", headers: headers(userB) })).status, 404);
  assert.equal((await request("/api/documents/" + body.sessionId, { method: "DELETE", headers: headers(userA) })).status, 200);
  assert.equal(await db.collections.documents().countDocuments({ sessionId: body.sessionId }), 0);
});
test("empty PDF and failed embeddings refund their reservation", async t => {
  const empty = await PDFDocument.create(); empty.addPage();
  const { GeminiEmbeddings } = await import("../src/lib/embeddings.js");
  const before = (await db.collections.users().findOne({ _id: userA })).credits;
  const emptyForm = new FormData(); emptyForm.append("pdf", new Blob([await empty.save({ useObjectStreams: false })], { type: "application/pdf" }), "empty.pdf");
  const rejected = await request("/api/upload", { method: "POST", headers: { Authorization: "Bearer " + token(userA) }, body: emptyForm });
  assert.ok(rejected.status >= 400);
  assert.equal((await db.collections.users().findOne({ _id: userA })).credits, before);
  t.mock.method(GeminiEmbeddings.prototype, "embedDocuments", async texts => texts.map(() => []));
  const pdf = await fs.readFile(new URL("../../frontend/public/sample-report.pdf", import.meta.url));
  const form = new FormData(); form.append("pdf", new Blob([pdf], { type: "application/pdf" }), "failure.pdf");
  const failed = await request("/api/upload", { method: "POST", headers: { Authorization: "Bearer " + token(userA) }, body: form });
  assert.equal(failed.status, 500);
  assert.equal((await db.collections.users().findOne({ _id: userA })).credits, before);
});

test("subscription periods require provider evidence and renew monotonically", async () => {
  const id = crypto.randomUUID();
  await db.collections.payments().insertOne({ _id: id, userId: userB, razorpaySubscriptionId: "sub_" + id, amount: 29900, currency: "INR", type: "subscription", planId: "pro_monthly", status: "created" });
  const entity = { id: "pay_sub_" + id, amount: 29900, currency: "INR", status: "captured" };
  await assert.rejects(db.withTransaction(session => payment.settlePayment(id, entity, null, session)), { code: "SUBSCRIPTION_PENDING" });
  const end = Math.floor(Date.now() / 1000) + 30 * 86400;
  await db.withTransaction(session => payment.settlePayment(id, entity, { current_end: end, status: "active" }, session));
  await db.withTransaction(session => payment.settlePayment(id, { ...entity, id: entity.id + "_renewal" }, { current_end: end + 30 * 86400, status: "active" }, session));
  await db.withTransaction(session => payment.settlePayment(id, entity, { current_end: end, status: "active" }, session));
  assert.equal((await db.collections.users().findOne({ _id: userB })).subscription.currentPeriodEnd.getTime(), (end + 30 * 86400) * 1000);
});

test("historical paid records remain refundable after the ledger upgrade", async () => {
  const id = crypto.randomUUID();
  await db.collections.payments().insertOne({ _id: id, userId: userA, razorpayPaymentId: "legacy_" + id, amount: 29900, currency: "INR", creditsGranted: 10, type: "credits", status: "paid" });
  const before = (await db.collections.users().findOne({ _id: userA })).credits;
  const event = { event: "refund.processed", payload: { refund: { entity: { id: "legacy_refund_" + id, payment_id: "legacy_" + id, amount: 29900 } } } };
  await payment.handleWebhookEvent(event, "legacy_event_" + id);
  assert.equal((await db.collections.users().findOne({ _id: userA })).credits, before - 10);
});

test("keyword retrieval isolates documents and finds exact identifiers", async () => {
  const { MongoVectorStore } = await import("../src/lib/vectorStore.js");
  const session = crypto.randomUUID();
  await db.collections.documents().insertMany([
    { sessionId: session, text: "The deployment error ERR_POOL_EXHAUSTED indicates database pool exhaustion.", metadata: { chunkId: "exact" } },
    { sessionId: "other-tenant", text: "ERR_POOL_EXHAUSTED private tenant information", metadata: { chunkId: "private" } },
  ]);
  const store = new MongoVectorStore({}, session);
  const matches = await store.lexicalSearch('"ERR_POOL_EXHAUSTED"');
  assert.equal(matches.length, 1); assert.equal(matches[0].metadata.chunkId, "exact");
  store.similaritySearch = async () => [];
  assert.equal((await store.hybridSearch('"ERR_POOL_EXHAUSTED"'))[0].metadata.chunkId, "exact");
});

test("RAG rewrites follow-ups and accepts only validated reranked evidence", async () => {
  const { buildRAGChain } = await import("../src/services/ragService.js");
  const { RunnableLambda } = await import("@langchain/core/runnables");
  const { HumanMessage, AIMessage } = await import("@langchain/core/messages");
  let call = 0, captured;
  const model = RunnableLambda.from(async () => new AIMessage(++call === 1 ? "What is the database connection timeout?" : '["evidence"]'));
  const store = { asRetriever() { return {}; }, async hybridSearch(query, limit, original) { captured = { query, original }; return [{ pageContent: "Connection timeout is 5 seconds.", metadata: { chunkId: "evidence", loc: { pageNumber: 3 } } }]; } };
  const prepared = await buildRAGChain(store, model).prepare({ question: "What about its timeout?", history: [new HumanMessage("Explain the database pool")] });
  assert.equal(captured.query, "What is the database connection timeout?");
  assert.equal(captured.original, "What about its timeout?");
  assert.equal(prepared.retrieval.rerank, "applied"); assert.equal(prepared.sources[0].page, 3);
  const refusal = await buildRAGChain(store, RunnableLambda.from(async () => new AIMessage("[]"))).prepare({ question: "What is the CEO's salary?", history: [] });
  assert.equal(refusal.insufficientEvidence, true); assert.deepEqual(refusal.sources, []);
  const fallback = await buildRAGChain(store, RunnableLambda.from(async () => new AIMessage('["fabricated"]'))).prepare({ question: "Timeout?", history: [] });
  assert.equal(fallback.retrieval.rerank, "failed"); assert.equal(fallback.insufficientEvidence, true); assert.deepEqual(fallback.sources, []);
});

test("retired generation and profile publishing endpoints are unavailable", async () => {
  for (const path of ["/api/career/generate-profile-ai", "/api/career/enhance-bio-ai", "/api/career/resume-to-readme", "/api/career/cover-letter", "/api/github/commit-readme"]) {
    const response = await request(path, { method: "POST", headers: headers(userA), body: "{}" });
    assert.equal(response.status, 404, path);
  }
});

test("hybrid search survives one failed branch and fails when both fail", async () => {
  const { MongoVectorStore } = await import("../src/lib/vectorStore.js");
  const store = new MongoVectorStore({}, "synthetic");
  const passage = { pageContent: "Evidence", metadata: { chunkId: "safe" } };
  store.similaritySearch = async () => { throw new Error("vector unavailable"); };
  store.lexicalSearch = async () => [passage];
  let result = await store.hybridSearch("query");
  assert.equal(result.length, 1); assert.deepEqual(result.diagnostics.failedBranches, ["vector"]);
  store.similaritySearch = async () => [passage];
  store.lexicalSearch = async () => { throw new Error("keyword unavailable"); };
  result = await store.hybridSearch("query"); assert.deepEqual(result.diagnostics.failedBranches, ["keyword"]);
  store.similaritySearch = async () => { throw new Error("vector unavailable"); };
  await assert.rejects(store.hybridSearch("query"), AggregateError);
});
test("hybrid cancellation never becomes a degraded success", async () => {
  const { MongoVectorStore } = await import("../src/lib/vectorStore.js");
  const store = new MongoVectorStore({}, "synthetic"); const controller = new AbortController();
  store.similaritySearch = async () => new Promise(() => {});
  store.lexicalSearch = async () => [];
  const waiting = store.hybridSearch("q", 20, "q", { signal: controller.signal });
  controller.abort(new Error("cancelled")); await assert.rejects(waiting, /cancelled/);
});
test("embedding calls receive cancellation and deadline options", async t => {
  const { GeminiEmbeddings } = await import("../src/lib/embeddings.js");
  const embedder = new GeminiEmbeddings(); const controller = new AbortController(); let options;
  t.mock.method(embedder.model, "embedContent", async (text, opts) => { options = opts; return { embedding: { values: [1, 0] } }; });
  await embedder.embedQuery("q", { signal: controller.signal, deadline: Date.now() + 1000 });
  assert.equal(options.signal, controller.signal); assert.ok(options.timeout <= 1000);
});

test("readiness does not claim local MongoDB has an Atlas search index", async () => {
  const response = await request("/api/ready"); assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "not_ready");
});
test("reranker cancellation exits even if a model does not settle", async () => {
  const { buildRAGChain } = await import("../src/services/ragService.js");
  const { RunnableLambda } = await import("@langchain/core/runnables");
  const model = RunnableLambda.from(() => new Promise(() => {}));
  const store = { asRetriever(){return {};}, async hybridSearch(){ return [{pageContent:"evidence",metadata:{chunkId:"id"}}];} };
  const controller = new AbortController();
  const work = buildRAGChain(store,model).prepare({question:"q",history:[]},{signal:controller.signal});
  setTimeout(()=>controller.abort(new Error("stop reranker")),20);
  await assert.rejects(work,/stop reranker/);
});
