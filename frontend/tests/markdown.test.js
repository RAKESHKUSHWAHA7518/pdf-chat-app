import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SafeMarkdown from "../src/components/ui/SafeMarkdown.js";
const render = source => renderToStaticMarkup(createElement(SafeMarkdown, null, source));
test("generated HTML cannot inject scripts, event handlers, frames or javascript links", () => {
  const html = render('<script>alert(1)</script><img src="x" onerror="alert(1)"><iframe src="https://example.com"></iframe><a href="javascript:alert(1)">click</a>');
  assert.doesNotMatch(html, /<script|onerror|<iframe|javascript:/i);
});
test("safe README tables, emphasis, and HTTPS images survive sanitization", () => {
  const html = render('| Skill | Level |\n| --- | --- |\n| **Node** | Good |\n\n![badge](https://example.com/badge.png)');
  assert.match(html, /<table>/); assert.match(html, /<strong>Node<\/strong>/); assert.match(html, /https:\/\/example.com\/badge.png/);
});

import { extractCitations, formatAssistantCitations } from "../src/utils/citations.js";
test("only retrieved pages become clickable citations", () => {
  const sources = [{ page: 2, excerpt: "Evidence" }];
  assert.deepEqual(extractCitations("[Page 2] and [Page 999]", sources), [2]);
  assert.equal(formatAssistantCitations("[Page 2] and [Page 999]", sources), "[Page 2](#page-2) and [Page 999]");
});
test("answers without source metadata do not claim verified citations", () => {
  assert.deepEqual(extractCitations("[Page 1]"), []);
  assert.equal(formatAssistantCitations("[Page 1]"), "[Page 1]");
});
