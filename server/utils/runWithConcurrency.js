/**
 * Run async task factories with a fixed concurrency limit to avoid exhausting
 * the Postgres pool (Supabase session mode caps concurrent connections).
 */
export async function runWithConcurrency(taskFactories, limit = 4) {
  if (!taskFactories.length) return [];

  const results = new Array(taskFactories.length);
  let nextIndex = 0;
  const poolSize = Math.min(Math.max(1, limit), taskFactories.length);

  const worker = async () => {
    while (nextIndex < taskFactories.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await taskFactories[index]();
    }
  };

  await Promise.all(Array.from({ length: poolSize }, worker));
  return results;
}
