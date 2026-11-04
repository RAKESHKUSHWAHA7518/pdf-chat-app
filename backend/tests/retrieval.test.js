import test from "node:test";
import assert from "node:assert/strict";
import { fuseRanks, budgetContext, validateRanking } from "../src/lib/retrieval.js";
const doc = (id, text = id, page = 1) => ({ pageContent: text, metadata: { chunkId: id, loc: { pageNumber: page } } });
test("fusion promotes evidence found by both retrievers and deduplicates", () => {
  const result = fuseRanks([[doc("noise"), doc("answer")], [doc("answer"), doc("exact")]]);
  assert.equal(result[0].metadata.chunkId, "answer");
  assert.equal(result.length, 3);
});
test("a repeated passage in one list cannot inflate its fusion score", () => {
  assert.deepEqual(fuseRanks([[doc("a"), doc("a")]]), fuseRanks([[doc("a")]]));
});
test("context budget is bounded and preserves source attribution", () => {
  const result = budgetContext([doc("a", "abcdef", 2), doc("b", "ghijkl", 3)], 9);
  assert.equal(result.map(d => d.pageContent).join(""), "abcdefghi");
  assert.equal(result[1].metadata.loc.pageNumber, 3);
});
test("reranker cannot introduce fabricated sources or duplicate IDs", () => {
  const candidates = [doc("a"), doc("b")];
  assert.throws(() => validateRanking(["invented"], candidates));
  assert.throws(() => validateRanking(["a", "a"], candidates));
  assert.deepEqual(validateRanking([], candidates), []);
  assert.equal(validateRanking(["b", "a"], candidates)[0].metadata.chunkId, "b");
});

import { abortable } from "../src/lib/deadline.js";
test("cancellation stops waiting and a pre-aborted request never starts work", async () => {
  const controller = new AbortController(); let started = false;
  controller.abort(new Error("cancelled"));
  await assert.rejects(abortable(() => { started = true; }, controller.signal), /cancelled/);
  assert.equal(started, false);
  const active = new AbortController();
  const waiting = abortable(() => new Promise(() => {}), active.signal);
  active.abort(new Error("deadline")); await assert.rejects(waiting, /deadline/);
});
