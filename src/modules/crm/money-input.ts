// Decimal UI input → exact integer storage; no exchange rate or floating arithmetic.
export function currencyDigits(currency:string) {return new Intl.NumberFormat("en",{style:"currency",currency}).resolvedOptions().maximumFractionDigits??2;}
export function parseAmount(value:string,currency:string):number|null|undefined {
 const text=value.trim();if(!text)return null;const digits=currencyDigits(currency);
 if(!new RegExp(digits?`^\\d+(?:[.,]\\d{1,${digits}})?$`:"^\\d+$").test(text))return undefined;
 const [whole,fraction=""]=text.split(/[.,]/);const minor=Number(whole+fraction.padEnd(digits,"0"));return Number.isSafeInteger(minor)&&minor<=999999999?minor:undefined;
}
export function amountInput(minor:unknown,currency:string) {
 if(typeof minor!=="number")return "";const digits=currencyDigits(currency),value=String(minor).padStart(digits+1,"0");return digits?`${value.slice(0,-digits)}.${value.slice(-digits)}`:value;
}
