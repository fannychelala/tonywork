import {simulationSchema,freeze,type Result,type Contribution} from "./contract";
import {profile,roundScoreBasisPoints,priorityFor} from "./profile";
export function score(input:unknown):Result{
 const parsed=simulationSchema.parse(input),p=profile(parsed.scoreVersion);
 const snapshot:Contribution[]=p.dimensions.map(d=>{
  const value=parsed.dimensions[d.dimension],utility=value===null?null:d.inverted?100-value:value;
  return {...d,value,utility,contributionNumerator:utility===null?null:d.weightBasisPoints*utility,
   code:utility===null?"UNKNOWN":utility>=p.reasonThresholds.favorable?"FAVORABLE":utility<=p.reasonThresholds.unfavorable?"UNFAVORABLE":"INTERMEDIATE"};
 });
 const missing=snapshot.filter(d=>d.value===null).map(d=>d.dimension);
 const common={source:parsed.source,scenarioId:parsed.scenarioId,scoreVersion:parsed.scoreVersion,calibration:p.calibration,snapshot,missing};
 if(missing.length)return freeze({...common,status:"INCOMPLETE" as const,scoreBasisPoints:null,priority:null});
 const scoreBasisPoints=roundScoreBasisPoints(snapshot.reduce((sum,d)=>sum+d.contributionNumerator!,0));
 return freeze({...common,status:"COMPLETE" as const,scoreBasisPoints,priority:priorityFor(scoreBasisPoints)});
}
export function rankSimulations(input:unknown){
 if(!Array.isArray(input)||input.length>100)throw new RangeError("Expected at most 100 simulations");
 const results=input.map((item:unknown)=>score(item));
 if(new Set(results.map(r=>r.scenarioId)).size!==results.length)throw new Error("Duplicate simulation identifier");
 const stable=(a:Result,b:Result)=>a.scenarioId<b.scenarioId?-1:a.scenarioId>b.scenarioId?1:0;
 const complete=results.filter(r=>r.status==="COMPLETE").sort((a,b)=>b.scoreBasisPoints-a.scoreBasisPoints||stable(a,b));
 const counts=new Map<number,number>();for(const r of complete)counts.set(r.scoreBasisPoints,(counts.get(r.scoreBasisPoints)??0)+1);
 let previous:number|undefined,position=0;
 const ranked=complete.map((result,i)=>{if(result.scoreBasisPoints!==previous)position=i+1;previous=result.scoreBasisPoints;return {rank:position,tied:counts.get(result.scoreBasisPoints)!>1,result};});
 const incomplete=results.filter(r=>r.status==="INCOMPLETE").sort(stable);
 return freeze({ranked,incomplete});
}
