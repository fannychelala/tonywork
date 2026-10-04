// Historical 1.0.0 references, independently calculated. Technical calibration only.
export const dimensions = ["economicPotential","effort","distance","urgency","conversionProbability","strategicFit","scheduleFit","customerValue"] as const;
export const references = [
 {id:"sim-high",values:[90,20,10,80,70,90,80,60],numerators:[225000,120000,90000,120000,70000,90000,80000,30000],score:8250,priority:"VERY_HIGH"},
 {id:"sim-costly",values:[90,90,80,40,50,60,30,20],numerators:[225000,15000,20000,60000,50000,60000,30000,10000],score:4700,priority:"NORMAL"},
 {id:"sim-urgent",values:[60,40,5,100,60,60,70,40],numerators:[150000,90000,95000,150000,60000,60000,70000,20000],score:6950,priority:"HIGH"},
 {id:"sim-distant",values:[30,80,90,10,20,30,20,10],numerators:[75000,30000,10000,15000,20000,30000,20000,5000],score:2050,priority:"LOW"},
 {id:"sim-fit",values:[65,30,30,50,65,95,95,70],numerators:[162500,105000,70000,75000,65000,95000,95000,35000],score:7025,priority:"HIGH"},
] as const;
export function input(id="sim-example",values:readonly (number|null)[]=[50,50,50,50,50,50,50,50]) {
 return {source:"SIMULATED",scenarioId:id,scoreVersion:"1.0.0",dimensions:Object.fromEntries(dimensions.map((key,i)=>[key,values[i]]))};
}
