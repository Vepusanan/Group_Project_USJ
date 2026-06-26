import test from "node:test";
import assert from "node:assert/strict";
import { runWithConcurrency } from "../utils/runWithConcurrency.js";

test("runWithConcurrency respects the concurrency limit", async () => {
  let inFlight = 0;
  let maxInFlight = 0;

  const tasks = Array.from({ length: 8 }, (_, index) => async () => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 20));
    inFlight -= 1;
    return index;
  });

  const results = await runWithConcurrency(tasks, 3);
  assert.deepEqual(results, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(maxInFlight, 3);
});
