import {z} from "zod";
export const dimensionKeys=["economicPotential","effort","distance","urgency","conversionProbability","strategicFit","scheduleFit","customerValue"] as const;
export type Dimension=typeof dimensionKeys[number];
const value=z.number().int().min(0).max(100).nullable();
export const simulationSchema=z.object({
 source:z.literal("SIMULATED"),scenarioId:z.string().regex(/^sim-[a-z0-9][a-z0-9-]{0,59}$/),scoreVersion:z.literal("1.0.0"),
 dimensions:z.object({economicPotential:value,effort:value,distance:value,urgency:value,conversionProbability:value,strategicFit:value,scheduleFit:value,customerValue:value}).strict(),
}).strict();
export type Simulation=z.infer<typeof simulationSchema>;
export type Priority="VERY_HIGH"|"HIGH"|"NORMAL"|"WAIT"|"LOW";
export type Reason="FAVORABLE"|"UNFAVORABLE"|"INTERMEDIATE"|"UNKNOWN";
export type Contribution=Readonly<{dimension:Dimension;value:number|null;inverted:boolean;weightBasisPoints:number;utility:number|null;contributionNumerator:number|null;code:Reason}>;
export type Result=Readonly<{
 source:"SIMULATED";scenarioId:string;scoreVersion:"1.0.0";calibration:"TECHNICAL_NOT_EMPIRICALLY_VALIDATED";
 snapshot:readonly Contribution[];missing:readonly Dimension[];
}> & (Readonly<{status:"COMPLETE";scoreBasisPoints:number;priority:Priority}>|Readonly<{status:"INCOMPLETE";scoreBasisPoints:null;priority:null}>);
export function freeze<T extends object>(value:T):Readonly<T>{
 for(const child of Object.values(value))if(child!==null&&typeof child==="object"&&!Object.isFrozen(child))freeze(child);
 return Object.freeze(value);
}
