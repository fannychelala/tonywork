import {it,expect} from "vitest";
import {performance} from "node:perf_hooks";
import {score,rankSimulations} from "../../src/modules/scoring/index";
import {input,references} from "./fixtures/scoring-v1";
it("measures only synthetic CPU batches with independently checked sums",()=>{
 const scenarios=references.map(r=>input(r.id,r.values));const hundred=Array.from({length:100},(_,i)=>input(`sim-${i}`));
 for(let i=0;i<1000;i++)score(scenarios[i%5]);
 const compute:number[]=[],ranking:number[]=[];
 for(let sample=0;sample<20;sample++){
  let sum=0;let start=performance.now();for(let i=0;i<1000;i++)sum+=score(scenarios[i%5]).scoreBasisPoints!;compute.push(performance.now()-start);expect(sum).toBe(5795000);
  start=performance.now();for(let i=0;i<10;i++){const r=rankSimulations(hundred);expect(r.ranked.reduce((s,x)=>s+x.result.scoreBasisPoints,0)).toBe(500000);}ranking.push(performance.now()-start);
 }
 const stats=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return {p50Ms:sorted[9],p95Ms:sorted[18],maxMs:sorted[19]};};
 console.log(JSON.stringify({measurement:"synthetic CPU, not server P95 or empirical calibration",samples:20,warmup:1000,scoreBatchSize:1000,score:stats(compute),rankingBatchSize:10,rankingItems:100,ranking:stats(ranking)}));
});
