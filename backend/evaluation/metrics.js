export function evaluate(cases, predictions) {
  const byId = new Map(predictions.map(row => [row.id, row]));
  if (byId.size !== predictions.length) throw new Error("Duplicate prediction IDs");
  if (cases.some(row => !byId.has(row.id)) || predictions.some(row => !cases.some(item => item.id === row.id))) throw new Error("Predictions must match every dataset case exactly");
  let recall = 0, mrr = 0, answerable = 0, refusal = 0;
  const durations = [];
  for (const row of cases) {
    const prediction = byId.get(row.id);
    if (!Array.isArray(prediction.sourceIds) || typeof prediction.refused !== "boolean") throw new Error("Invalid prediction schema");
    const hits = prediction.sourceIds.slice(0,6);
    if (row.expectedSourceIds.length) {
      answerable++;
      recall += row.expectedSourceIds.filter(id => hits.includes(id)).length / row.expectedSourceIds.length;
      const rank = hits.findIndex(id => row.expectedSourceIds.includes(id)); mrr += rank < 0 ? 0 : 1 / (rank + 1);
    }
    refusal += Number(prediction.refused === (row.expectedSourceIds.length === 0));
    if (Number.isFinite(prediction.durationMs) && prediction.durationMs >= 0) durations.push(prediction.durationMs);
  }
  durations.sort((a,b)=>a-b);
  return { cases: cases.length, recallAt6: answerable ? recall/answerable : null, mrrAt6: answerable ? mrr/answerable : null, refusalDecisionAccuracy: cases.length ? refusal/cases.length : null, latencySamples: durations.length, p50Ms: durations.length ? durations[Math.ceil(durations.length*.5)-1] : null, p95Ms: durations.length ? durations[Math.ceil(durations.length*.95)-1] : null, answerCorrectness: "requires human review", citationEntailment: "requires human review" };
}
