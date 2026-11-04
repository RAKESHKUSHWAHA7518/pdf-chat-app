import fs from "node:fs/promises";
import { evaluate } from "./metrics.js";
const [dataset, predictions] = process.argv.slice(2);
if (!dataset || !predictions) { console.error("Usage: npm run evaluate -- dataset.json predictions.json"); process.exitCode = 1; }
else { const report = evaluate(JSON.parse(await fs.readFile(dataset,"utf8")), JSON.parse(await fs.readFile(predictions,"utf8"))); console.log(JSON.stringify(report,null,2)); }
