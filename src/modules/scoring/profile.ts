import {freeze,type Dimension,type Priority} from "./contract";
// Accepted technical calibration only. Never claim empirical commercial validity.
export const profileV1=freeze({version:"1.0.0" as const,calibration:"TECHNICAL_NOT_EMPIRICALLY_VALIDATED" as const,
 dimensions:[
  {dimension:"economicPotential",weightBasisPoints:2500,inverted:false},
  {dimension:"effort",weightBasisPoints:1500,inverted:true},
  {dimension:"distance",weightBasisPoints:1000,inverted:true},
  {dimension:"urgency",weightBasisPoints:1500,inverted:false},
  {dimension:"conversionProbability",weightBasisPoints:1000,inverted:false},
  {dimension:"strategicFit",weightBasisPoints:1000,inverted:false},
  {dimension:"scheduleFit",weightBasisPoints:1000,inverted:false},
  {dimension:"customerValue",weightBasisPoints:500,inverted:false},
 ] as readonly Readonly<{dimension:Dimension;weightBasisPoints:number;inverted:boolean}>[],
 thresholds:[{minimum:8000,priority:"VERY_HIGH"},{minimum:6500,priority:"HIGH"},{minimum:4500,priority:"NORMAL"},{minimum:2500,priority:"WAIT"},{minimum:0,priority:"LOW"}] as readonly Readonly<{minimum:number;priority:Priority}>[],
 reasonThresholds:{favorable:70,unfavorable:30},
});
// No implicit default/latest alias; this closed registry contains only the validated profile.
export function profile(version:unknown){if(version!==profileV1.version)throw new Error("Unsupported score version");return profileV1;}
export function roundScoreBasisPoints(numerator:number){
 if(!Number.isSafeInteger(numerator)||numerator<0||numerator>1000000)throw new RangeError("Invalid aggregate");
 return Math.floor((numerator+50)/100);
}
export function priorityFor(points:number):Priority{
 if(!Number.isSafeInteger(points)||points<0||points>10000)throw new RangeError("Invalid score");
 return profileV1.thresholds.find(t=>points>=t.minimum)!.priority;
}
