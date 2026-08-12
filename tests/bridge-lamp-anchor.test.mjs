import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../script.js", import.meta.url), "utf8");

test("bridge lamp supports stay anchored to the north rail", () => {
  const supportAnchors = source.match(/supportY:\s*9\b/g) ?? [];
  const supportXs = [...source.matchAll(/supportX:\s*(\d+)\b/g)].map((match) =>
    Number(match[1]),
  );

  assert.equal(
    supportAnchors.length,
    3,
    "the two ambient lamps and the standalone festival lamp must anchor their supports at y=9",
  );
  assert.deepEqual(
    supportXs,
    [11, 14, 14],
    "the right supports must stay on the x=14 bridge end while their lanterns extend outward",
  );
  assert.match(
    source,
    /lamp\.supportX/,
    "ambient lamp rendering must use the support anchor separately from the lantern body",
  );
  assert.match(
    source,
    /lantern\.supportX/,
    "festival lamp rendering must use the support anchor separately from the lantern body",
  );
});
