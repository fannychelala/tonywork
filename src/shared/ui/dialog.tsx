"use client";
import { useId, useRef, type ReactNode } from "react";
import { Button } from "./primitives";
export function Dialog({ label, title, close, children, drawer = false }: { label: string; title: string; close: string; children: ReactNode; drawer?: boolean }) {
 const ref = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null), id = useId();
 return <><Button ref={trigger} variant="secondary" onClick={() => ref.current?.showModal()} aria-haspopup="dialog">{label}</Button>
 <dialog ref={ref} aria-labelledby={id} className={drawer ? "ui-dialog ui-drawer" : "ui-dialog"} onClose={() => trigger.current?.focus()}>
  <div className="dialog-heading"><h2 id={id}>{title}</h2><Button variant="quiet" autoFocus onClick={() => ref.current?.close()}>{close}<span aria-hidden="true"> ×</span></Button></div>{children}
 </dialog></>;
}
