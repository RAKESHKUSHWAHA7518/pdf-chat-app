import {test} from "node:test";
import assert from "node:assert/strict";
import {skipReason,containsSecret,codeChunks,codeCitation} from "../src/services/repository/source.js";
test("repository source filters secrets and provides immutable line citations",()=>{
 assert.ok(skipReason(".env.production"));assert.ok(skipReason("node_modules/a.js"));
 assert.ok(skipReason("key.pem"));assert.equal(skipReason("src/a.ts"),null);
 assert.ok(containsSecret('const password = "sensitive-value"'));
 const sha="a".repeat(40),chunks=codeChunks("src/a.ts","export function add(a: number) {\n return a + 1;\n}",sha);
 assert.equal(chunks[0].metadata.parser,"babel");assert.equal(chunks.at(-1).metadata.endLine,3);
 assert.match(codeCitation("owner","repo",sha,chunks[0].metadata),/blob\/a{40}\/src\/a.ts#L1-L3$/);
 assert.throws(()=>codeCitation("owner","repo","main",chunks[0].metadata));
 assert.equal(codeChunks("invalid.js","export ???",sha)[0].metadata.parser,"text-fallback");
});
