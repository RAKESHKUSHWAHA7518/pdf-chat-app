export function throwIfAborted(signal) { signal?.throwIfAborted(); }
export async function abortable(work, signal) {
  throwIfAborted(signal);
  if (!signal) return work();
  let listener;
  const aborted = new Promise((_, reject) => { listener = () => reject(signal.reason || new Error("Request cancelled")); signal.addEventListener("abort", listener, { once: true }); });
  try { return await Promise.race([Promise.resolve().then(() => { throwIfAborted(signal); return work(); }), aborted]); }
  finally { signal.removeEventListener("abort", listener); }
}
export function databaseOptions(options = {}) {
  throwIfAborted(options.signal);
  return { signal: options.signal, maxTimeMS: Math.max(1, Math.min(10000, (options.deadline || Date.now() + 10000) - Date.now())) };
}
