import test from "node:test";
import assert from "node:assert/strict";
import {evaluate} from "../evaluation/metrics.js";
test("evaluation penalizes missing evidence, wrong refusals and bad ranks",()=>{
 const report=evaluate([{id:"a",expectedSourceIds:["x","y"]},{id:"b",expectedSourceIds:[]}],[{id:"a",sourceIds:["noise","x"],refused:false,durationMs:20},{id:"b",sourceIds:[],refused:false,durationMs:40}]);
 assert.equal(report.recallAt6,.5);assert.equal(report.mrrAt6,.5);assert.equal(report.refusalDecisionAccuracy,.5);assert.equal(report.p95Ms,40);
 assert.throws(()=>evaluate([{id:"a",expectedSourceIds:[]}],[]));
});
