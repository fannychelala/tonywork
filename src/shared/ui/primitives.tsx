import type { ComponentProps, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
export function Button({ className = "", variant = "primary", ...props }: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "quiet" }) {
 return <button type="button" {...props} className={`ui-button ui-button--${variant} ${className}`} />;
}
export function Card({ className = "", ...props }: HTMLAttributes<HTMLElement>) { return <section {...props} className={`ui-card ${className}`} />; }
export function Alert({ children, error = false }: { children: ReactNode; error?: boolean }) { return <p className={`ui-alert${error ? " ui-alert--error" : ""}`} role={error ? "alert" : "status"}>{children}</p>; }
export function EmptyState({ title, detail, children }: { title: string; detail: string; children?: ReactNode }) {
 return <Card className="empty-state"><span className="empty-mark" aria-hidden="true">↗</span><h2>{title}</h2><p>{detail}</p>{children && <div className="state-actions">{children}</div>}</Card>;
}
export function Skeleton({ label }: { label: string }) { return <div className="ui-skeleton" role="status" aria-label={label}><span /><span /><span /></div>; }
export function Field({ label, error, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string | undefined }) {
 return <div className="ui-field"><label htmlFor={id}>{label}</label><input {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />{error && <p id={`${id}-error`} role="alert">{error}</p>}</div>;
}
