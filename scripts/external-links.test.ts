import assert from "node:assert/strict";
import { test } from "node:test";
import { addUtmSource } from "../src/modules/url/external-link";

test("adds Springfall attribution to external HTTP(S) and protocol-relative links", () => {
  for (const href of [
    "https://example.com/article",
    "http://example.com/article",
    "//example.com/article",
    "https://springfall.cc.example.com/article",
  ]) {
    const result = new URL(addUtmSource(href));
    assert.equal(result.searchParams.get("utm_source"), "springfall.cc");
    assert.equal(result.pathname, "/article");
    assert.equal(addUtmSource(result.href), result.href);
  }
});

test("replaces existing sources while preserving other query values and fragments", () => {
  const result = new URL(addUtmSource(
    "https://example.com/search?q=a%20b%2Bc&utm_medium=referral&utm_source=old&utm_source=duplicate#section-2",
  ));
  assert.deepEqual(result.searchParams.getAll("utm_source"), ["springfall.cc"]);
  assert.equal(result.searchParams.get("utm_medium"), "referral");
  assert.equal(result.searchParams.get("q"), "a b+c");
  assert.equal(result.hash, "#section-2");
});

test("preserves internal links, other protocols, empty and invalid URLs", () => {
  for (const href of [
    "", "#heading", "?page=2", "/ko/til/", "../article/", "article/",
    "https://springfall.cc/ko/til/?utm_source=existing#heading",
    "http://springfall.cc/", "https://www.springfall.cc/", "//springfall.cc/",
    "mailto:hello@example.com", "tel:+821012345678", "ftp://example.com/file",
    "data:text/plain,hello", "javascript:void(0)", "https://[invalid",
  ]) {
    assert.equal(addUtmSource(href), href);
  }
});
