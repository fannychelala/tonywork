"use client";
import { useState } from "react";
import { z } from "zod";
import { Alert, Button, Field } from "@/shared/ui/primitives";
import type { ShellMessages } from "@/shared/i18n/shell";
const schema = z.string().trim().min(2).max(40);
export function DemoForm({ t }: { t: ShellMessages }) {
 const [value, setValue] = useState(""), [state, setState] = useState<"idle" | "invalid" | "valid">("idle");
 return <><p>{t.demoDetail}</p><form noValidate onSubmit={event => { event.preventDefault(); setState(schema.safeParse(value).success ? "valid" : "invalid"); }}>
 <Field id="demo-title" label={t.label} value={value} placeholder={t.placeholder} maxLength={40} onChange={event => { setValue(event.target.value); setState("idle"); }} error={state === "invalid" ? t.demoInvalid : undefined} />
 <Button type="submit">{t.demoValidate}</Button>{state === "valid" && <Alert>{t.demoValid}</Alert>}
 </form></>;
}
