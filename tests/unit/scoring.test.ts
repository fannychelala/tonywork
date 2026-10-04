import {describe,it,expect} from "vitest";
import {score,rankSimulations,explain,profileV1,roundScoreBasisPoints,priorityFor} from "../../src/modules/scoring/index";
import {dimensions,references,input} from "./fixtures/scoring-v1";
describe("simulated engine 1.0.0 technical calibration, not empirical commercial validation",()=>{
 it.each(references)("replays independent historical $id",r=>{
  const s=score(input(r.id,r.values));expect(s.status).toBe("COMPLETE");expect(s.scoreBasisPoints).toBe(r.score);expect(s.priority).toBe(r.priority);expect(s.scoreVersion).toBe("1.0.0");expect(s.snapshot.map(d=>d.contributionNumerator)).toEqual(r.numerators);expect(s.snapshot.map(d=>d.value)).toEqual(r.values);
 });
 it("strictly rejects unknown/identity/PII and nested fields",()=>{
  for(const key of ["organizationId","session","contactId","opportunityId","actor","phone","email","name","address","weights"])expect(()=>score({...input(),[key]:"forbidden"})).toThrow();
  expect(()=>score({...input(),dimensions:{...input().dimensions,other:10}})).toThrow();expect(()=>score({...input(),source:"REAL"})).toThrow();
  for(const scenarioId of ["raw","sim-<script>","sim-"+"a".repeat(65),"123e4567-e89b-12d3-a456-426614174000"])expect(()=>score({...input(),scenarioId})).toThrow();
 });
 it.each(["50",0.5,NaN,Infinity,-Infinity,-1,101,undefined])("rejects dimension %s without coercion",value=>{expect(()=>score({...input(),dimensions:{...input().dimensions,urgency:value}})).toThrow();});
 it("rejects missing keys and versions including latest",()=>{
  expect(()=>score({...input(),dimensions:{economicPotential:50}})).toThrow();for(const scoreVersion of ["latest","1.1.0","","1.0"])expect(()=>score({...input(),scoreVersion})).toThrow();
 });
 it("unknown is incomplete without normalization or invented priority",()=>{
  const s=score(input("sim-incomplete",[80,null,20,null,60,70,80,90]));expect(s.status).toBe("INCOMPLETE");expect(s.scoreBasisPoints).toBeNull();expect(s.priority).toBeNull();expect(s.missing).toEqual(["effort","urgency"]);expect(s.snapshot[1]).toMatchObject({value:null,utility:null,contributionNumerator:null,code:"UNKNOWN"});expect(s.snapshot[0]?.contributionNumerator).toBe(200000);
  expect(score(input("sim-all-unknown",Array(8).fill(null))).missing).toEqual([...dimensions]);
 });
 it("exact bounds and one half-up aggregate rounding",()=>{
  expect(score(input("sim-zero",[0,100,100,0,0,0,0,0])).scoreBasisPoints).toBe(0);expect(score(input("sim-max",[100,0,0,100,100,100,100,100])).scoreBasisPoints).toBe(10000);
  for(const [n,result] of [[0,0],[49,0],[50,1],[149,1],[150,2],[999999,10000],[1000000,10000]] as const)expect(roundScoreBasisPoints(n)).toBe(result);
  for(const n of [-1,0.5,NaN,Infinity,1000001])expect(()=>roundScoreBasisPoints(n)).toThrow();
 });
 it.each([25,45,65,80])("exact boundary %s before presentation rounding",threshold=>{
  const index=[25,45,65,80].indexOf(threshold),labels=["LOW","WAIT","NORMAL","HIGH","VERY_HIGH"];
  expect(priorityFor(threshold*100-1)).toBe(labels[index]);expect(priorityFor(threshold*100)).toBe(labels[index+1]);expect(priorityFor(threshold*100+1)).toBe(labels[index+1]);
  const values=dimensions.map(key=>key==="effort"||key==="distance"?100-threshold:threshold);expect(score(input("sim-threshold",values)).scoreBasisPoints).toBe(threshold*100);
 });
 it.each(dimensions)("monotonic entire range of %s",key=>{
  let previous:number|null=null;for(let value=0;value<=100;value++){const s=score({...input(),dimensions:{...input().dimensions,[key]:value}});const current=s.scoreBasisPoints!;if(previous!==null)expect(key==="effort"||key==="distance"?current<=previous:current>=previous).toBe(true);previous=current;}
 });
 it("profile deeply frozen, input preserved, result independent",()=>{
  expect(profileV1.calibration).toBe("TECHNICAL_NOT_EMPIRICALLY_VALIDATED");expect(profileV1.dimensions.map(d=>d.weightBasisPoints)).toEqual([2500,1500,1000,1500,1000,1000,1000,500]);expect(Object.isFrozen(profileV1)).toBe(true);expect(Object.isFrozen(profileV1.dimensions)).toBe(true);
  for(const d of profileV1.dimensions)expect(Object.isFrozen(d)).toBe(true);expect(()=>Reflect.set(profileV1.dimensions[0]!,"weightBasisPoints",0)).not.toThrow();expect(profileV1.dimensions[0]?.weightBasisPoints).toBe(2500);
  const i=input();Object.freeze(i.dimensions);Object.freeze(i);const before=JSON.stringify(i),s=score(i);expect(JSON.stringify(i)).toBe(before);expect(Object.isFrozen(s.snapshot[0])).toBe(true);expect(score(i)).toEqual(s);
 });
 it("explanations exact, bounded, missing explicit and locale independent",()=>{
  for(const utility of [30,31,69,70]){const s=score(input("sim-reason",[utility,100-utility,100-utility,utility,utility,utility,utility,utility]));expect(s.snapshot.every(d=>d.code===(utility<=30?"UNFAVORABLE":utility>=70?"FAVORABLE":"INTERMEDIATE"))).toBe(true);}
  const s=score(input(references[0].id,references[0].values)),fr=explain(s,"fr-FR"),en=explain(s,"en-GB");expect(fr.lines).toHaveLength(8);expect(fr.favorable).toHaveLength(2);expect(fr.favorable).toEqual(en.favorable);expect(fr.unfavorable).toEqual([]);expect(fr.lines[0]).toContain("22,50");expect(en.lines[0]).toContain("22.50");expect(fr.notice).toContain("Simulation");expect(fr.notice).toContain("non validée");expect(()=>explain(s,"xx")).toThrow();
  const unknown=explain(score(input("sim-missing",Array(8).fill(null))),"fr-FR");expect(unknown.favorable).toEqual([]);expect(unknown.unfavorable).toEqual([]);expect(unknown.lines.every(line=>line.includes("inconnue"))).toBe(true);
 });
 it("ranking: independent expected order, ties, incomplete and immutability",()=>{
  const cases=references.map(r=>input(r.id,r.values));cases.push(input("sim-tie",references[0].values),input("sim-incomplete",Array(8).fill(null)));const before=JSON.stringify(cases),r=rankSimulations(cases);
  expect(r.ranked.map(x=>x.result.scenarioId)).toEqual(["sim-high","sim-tie","sim-fit","sim-urgent","sim-costly","sim-distant"]);expect(r.ranked.slice(0,2).map(x=>[x.rank,x.tied])).toEqual([[1,true],[1,true]]);expect(r.ranked[2]?.rank).toBe(3);expect(r.incomplete.map(x=>x.scenarioId)).toEqual(["sim-incomplete"]);expect(rankSimulations([...cases].reverse())).toEqual(r);expect(JSON.stringify(cases)).toBe(before);
 });
 it("ranking rejects duplicates, unknown/mixed versions and excessive lists",()=>{
  expect(()=>rankSimulations([input(),input()])).toThrow();expect(()=>rankSimulations([input(),{...input("sim-other"),scoreVersion:"2.0.0"}])).toThrow();expect(()=>rankSimulations(Array.from({length:101},(_,i)=>input(`sim-${i}`)))).toThrow();expect(rankSimulations([])).toEqual({ranked:[],incomplete:[]});expect(rankSimulations(Array.from({length:100},(_,i)=>input(`sim-${i}`))).ranked).toHaveLength(100);
 });
 it("alternating/concurrent A/B is isolated without authorizing any tenant",async()=>{
  const a=input("sim-group-a",references[0].values),b=input("sim-group-b",references[1].values),expectedA=score(a),expectedB=score(b);
  for(let i=0;i<20;i++){expect(score(a)).toEqual(expectedA);expect(score(b)).toEqual(expectedB);}
  const results=await Promise.all(Array.from({length:40},(_,i)=>Promise.resolve().then(()=>score(i%2?a:b))));for(const [i,r]of results.entries()){expect(r).toEqual(i%2?expectedA:expectedB);expect(JSON.stringify(r)).not.toContain(i%2?"sim-group-b":"sim-group-a");}
 });
});
