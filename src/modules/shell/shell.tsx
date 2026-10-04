"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { shellDictionaries } from "@/shared/i18n/shell";
import { defaultLocale } from "@/shared/i18n/messages";
import { Button, Card, EmptyState, Skeleton } from "@/shared/ui/primitives";
import { Dialog } from "@/shared/ui/dialog";
import { screens, type Screen } from "./screens";
import { DemoForm } from "./demo-form";
const dto = z.object({ id: z.uuid(), name: z.string() }).strict();
type Access = { status: "ready"; name: string } | { status: "loading" | "required" | "denied" | "error" };
async function loadOrganization(id: string, signal: AbortSignal): Promise<Access | null> {
 try {
  const response = await fetch(`/api/shell/${encodeURIComponent(id)}`, { cache: "no-store", signal });
  if (signal.aborted) return null;
  if (!response.ok) return { status: response.status === 401 ? "required" : response.status === 404 ? "denied" : "error" };
  const data = dto.parse(await response.json());
  if (data.id !== id) return { status: "error" };
  return { status: "ready", name: data.name };
 } catch { return signal.aborted ? null : { status: "error" }; }
}
const icons: Record<Screen, string> = { today: "◷", opportunities: "↗", contacts: "◎", services: "▤", settings: "⚙" };
export function Shell({ organizationId, screen }: { organizationId: string; screen: Screen }) {
 const t = shellDictionaries[defaultLocale], [access, setAccess] = useState<Access>({ status: "loading" });
 const controller = useRef<AbortController | null>(null);
 const conceal = useCallback(() => { document.documentElement.dataset.shellPrivate = "hidden"; controller.current?.abort(); setAccess({ status: "loading" }); }, []);
 const verify = useCallback(() => {
  controller.current?.abort(); document.documentElement.dataset.shellPrivate = "hidden";
  const current = new AbortController(); controller.current = current;
  void loadOrganization(organizationId, current.signal).then(result => {
   if (!result || current.signal.aborted) return;
   setAccess(result);
   if (result.status === "ready") document.documentElement.dataset.shellPrivate = "visible";
  });
 }, [organizationId]);
 useEffect(() => {
  // Pagehide hides private DOM synchronously before a browser history snapshot is stored.
  const visibility = () => { if (document.visibilityState === "hidden") conceal(); else { conceal(); void verify(); } };
  const show = () => { conceal(); void verify(); };
  const hide = () => { conceal(); };
  void verify(); window.addEventListener("pagehide", hide); window.addEventListener("pageshow", show); window.addEventListener("focus", show); document.addEventListener("visibilitychange", visibility);
  return () => { controller.current?.abort(); window.removeEventListener("pagehide", hide); window.removeEventListener("pageshow", show); window.removeEventListener("focus", show); document.removeEventListener("visibilitychange", visibility); };
 }, [conceal, verify]);
 async function signout() {
  conceal();
  try {
   const response = await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
   if (!response.ok) { setAccess({ status: "error" }); return; }
   window.location.replace("/");
  } catch { setAccess({ status: "error" }); }
 }
 const nav = <nav aria-label={t.navigation}>{screens.map(item => <a key={item} href={`/app/${encodeURIComponent(organizationId)}/${item}`} aria-current={item === screen ? "page" : undefined}><span aria-hidden="true">{icons[item]}</span>{t[item]}</a>)}</nav>;
 return <div className="app-shell">
 <aside className="sidebar"><Link href="/" prefetch={false} className="wordmark" aria-label="Tony">tony<span aria-hidden="true">.</span></Link><p className="workspace-label">{t.workspace}</p>{nav}<div className="sidebar-note">{t.development}</div></aside>
 <div className="shell-body"><header className="shell-header"><div className="mobile-menu"><Dialog label={t.menu} title={t.navigation} close={t.close} drawer>{nav}</Dialog></div><span className="shell-breadcrumb">{t.workspace}<span aria-hidden="true"> / </span><strong>{t[screen]}</strong></span><span className="development-dot">{t.development}</span></header>
 <main id="main" tabIndex={-1} className="shell-main">
 <div className="page-heading"><p className="eyebrow">{t.workspace}</p><h1>{t[screen]}</h1><p>{t[`${screen}Intro`]}</p></div>
 {access.status === "loading" ? <div aria-busy="true"><p className="status">{t.loading}</p><Skeleton label={t.checking} /></div> : access.status !== "ready" ? <div data-testid={`access-${access.status}`}><EmptyState title={t[access.status]} detail={t[`${access.status}Detail`]}><Link prefetch={false} className="ui-button ui-button--secondary" href="/">{t.home}</Link>{access.status === "error" && <Button onClick={() => { conceal(); void verify(); }}>{t.refresh}</Button>}</EmptyState></div> :
 <div className="shell-private"><div className="organization-strip"><span className="organization-avatar" aria-hidden="true">{access.name.slice(0,1).toUpperCase()}</span><span data-testid="organization-name">{access.name}</span><Button variant="quiet" onClick={() => void signout()}>{t.signout}</Button></div>
 <EmptyState title={t[`${screen}Empty`]} detail={t[`${screen}Detail`]} />
 <Card className="next-step"><div><h2>{t.next}</h2><p>{t.nextDetail}</p></div><Dialog label={t.learn} title={t.aboutTitle} close={t.close}><p>{t.aboutDetail}</p></Dialog></Card>
 {screen === "settings" && <div className="component-example"><Dialog label={t.demoOpen} title={t.demoTitle} close={t.close}><DemoForm t={t} /></Dialog></div>}
 </div>}
 </main><footer className="shell-footer">{t.local}</footer></div></div>;
}
