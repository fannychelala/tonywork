import {freeze,type Result,type Dimension} from "./contract";
import {profile} from "./profile";
import {scoringDictionaries} from "../../shared/i18n/scoring";
import type {Locale} from "../../shared/i18n/messages";
export function explain(result:Result,locale:unknown){
 if(locale!=="fr-FR"&&locale!=="en-GB")throw new Error("Unsupported explanation locale");
 const p=profile(result.scoreVersion),t=scoringDictionaries[locale as Locale];
 const number=new Intl.NumberFormat(locale,{minimumFractionDigits:2,maximumFractionDigits:2});
 const lines=result.snapshot.map(d=>d.utility===null?`${t.dimensions[d.dimension]} : ${t.unknown}.`:
  `${t.dimensions[d.dimension]} : ${t.index} ${d.value}, ${d.inverted?t.inverted:t.direct} ; ${t.utility} ${d.utility}/100 ; ${t.contribution} ${number.format(d.contributionNumerator!/10000)} / 100.`);
 const selected=(code:"FAVORABLE"|"UNFAVORABLE"):Dimension[]=>result.snapshot.filter(d=>d.code===code).sort((a,b)=>b.weightBasisPoints-a.weightBasisPoints||p.dimensions.findIndex(d=>d.dimension===a.dimension)-p.dimensions.findIndex(d=>d.dimension===b.dimension)).slice(0,2).map(d=>d.dimension);
 return freeze({notice:t.notice,priority:result.priority===null?t.incomplete:t.priorities[result.priority],lines,favorable:selected("FAVORABLE"),unfavorable:selected("UNFAVORABLE")});
}
