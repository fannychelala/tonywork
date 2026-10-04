"use client";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Button } from "./primitives";
export function Dialog({ label, title, close, children, drawer = false, lazy = false }: { label: string; title: string; close: string; children: ReactNode; drawer?: boolean; lazy?: boolean }) {
 const [opened, setOpened] = useState(false);
 const ref = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null), id = useId();
 function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element => element.getClientRects().length > 0);
  const first = controls[0], last = controls.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
 }
 return <><Button ref={trigger} variant="secondary" onClick={() => { trigger.current?.focus(); if (lazy) flushSync(() => setOpened(true)); ref.current?.showModal(); }} aria-haspopup="dialog">{label}</Button>
 <dialog ref={ref} aria-labelledby={id} className={drawer ? "ui-dialog ui-drawer" : "ui-dialog"} onKeyDown={containFocus} onClose={() => { if (lazy) setOpened(false); }}>
  <div className="dialog-heading"><h2 id={id}>{title}</h2><Button variant="quiet" autoFocus onClick={() => ref.current?.close()}>{close}<span aria-hidden="true"> ×</span></Button></div>{lazy ? opened ? children : null : children}
 </dialog></>;
}
