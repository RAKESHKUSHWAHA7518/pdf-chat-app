# RAG evaluation

The dataset contains 30 explicitly synthetic starter cases over five short policy passages. Several are simple paraphrases; this is a smoke dataset, not evidence of general quality. Replace or extend with manually reviewed real PDFs, follow-ups, conflicts and hostile instructions. No model scores have been invented.

Collect predictions from the actual pipeline for each case in dataset.json. Save a JSON array with id, sourceIds (ordered retrieved chunk IDs), refused (boolean), optional durationMs, and answer for manual review. Source IDs must map to the labels in your dataset. Use the same labelled sources for baseline and hybrid runs. Never substitute expected answers as predictions.

Run: npm run evaluate -- evaluation/dataset.json predictions.json

The runner reports recall@6, reciprocal rank, refusal-decision accuracy and measured latency percentiles. It requires every case exactly once. It does not grade answer truth or citation entailment; review those separately. Model calls and live Atlas retrieval have not been benchmarked by this change. Keep a held-out real-document set before publishing quality claims.
