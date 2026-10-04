import {it,expect} from "vitest";
import {readFileSync,readdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import ts from "typescript";
import {score,explain,profileV1} from "../../src/modules/scoring/index";
import {input,references,dimensions} from "./fixtures/scoring-v1";
it("every historical snapshot is exact, frozen and detached from caller",()=>{
 for(const r of references){const data=input(r.id,r.values),result=score(data);
  expect(result).toEqual({source:"SIMULATED",scenarioId:r.id,scoreVersion:"1.0.0",calibration:"TECHNICAL_NOT_EMPIRICALLY_VALIDATED",status:"COMPLETE",scoreBasisPoints:r.score,priority:r.priority,missing:[],snapshot:dimensions.map((dimension,i)=>{
   const value=r.values[i]!,inverted=i===1||i===2,utility=inverted?100-value:value;
   return {dimension,value,inverted,utility,weightBasisPoints:[2500,1500,1000,1500,1000,1000,1000,500][i],contributionNumerator:r.numerators[i],code:utility>=70?"FAVORABLE":utility<=30?"UNFAVORABLE":"INTERMEDIATE"};
  })});
  data.dimensions.urgency=null;expect(result.snapshot[3]?.value).toBe(r.values[3]);expect(score(input(r.id,r.values))).toEqual(result);expect(Object.isFrozen(result)).toBe(true);expect(Object.isFrozen(result.snapshot)).toBe(true);
 }
 expect(Object.isFrozen(profileV1.thresholds)).toBe(true);expect(Object.isFrozen(profileV1.reasonThresholds)).toBe(true);for(const threshold of profileV1.thresholds)expect(Object.isFrozen(threshold)).toBe(true);
});
it("explanation ties use dimension order, costs invert, no invented unit",()=>{
 const s=score(input("sim-compromise",[90,90,90,90,90,90,90,90]));
 for(const locale of ["fr-FR","en-GB"]){const e=explain(s,locale);expect(e.favorable).toEqual(["economicPotential","urgency"]);expect(e.unfavorable).toEqual(["effort","distance"]);expect(e.lines[1]).toContain("10/100");expect(e.lines.join(" ")).not.toMatch(/\bkm\b|€|£|\$|tomorrow|demain|guaranteed|garanti/);expect(e.notice).toContain("V1");}
});
it("entire runtime scoring graph has no DB/auth/provider/network/time/random/state capability",()=>{
 const directory=resolve("src/modules/scoring"),dictionary=resolve("src/shared/i18n/scoring.ts");
 const files=[...readdirSync(directory).filter(f=>f.endsWith(".ts")).map(f=>resolve(directory,f)),dictionary];
 for(const file of files){const source=readFileSync(file,"utf8"),tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
  const visit=(node:ts.Node)=>{
   if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node)){
    const spec=node.moduleSpecifier;if(spec&&ts.isStringLiteral(spec)){
     const name=spec.text;
     if(ts.isImportDeclaration(node)&&node.importClause?.isTypeOnly){expect(name).toMatch(/contract$|messages$/);}
     else if(name!=="zod"){expect(name.startsWith(".")).toBe(true);const target=resolve(dirname(file),`${name}.ts`);expect(files).toContain(target);}
    }
   }
   if(ts.isCallExpression(node)||ts.isNewExpression(node))expect(node.expression.getText(tree)).not.toMatch(/^(fetch|Date|Math\.random|require|eval|Function|setTimeout|setInterval|console\.|process\.|performance\.|crypto\.|import\b)/);
   if(ts.isIdentifier(node))expect(["Prisma","PrismaClient","getAuth","getDatabase","withTenant","XMLHttpRequest","localStorage","globalThis","window","process"]).not.toContain(node.text);
   ts.forEachChild(node,visit);
  };visit(tree);
 }
});
