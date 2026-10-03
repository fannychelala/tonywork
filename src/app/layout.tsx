import type { Metadata } from "next";
import { dictionaries, defaultLocale } from "@/shared/i18n/messages";
import "./globals.css";
const messages = dictionaries[defaultLocale];
export const metadata: Metadata = { title: messages.name, description: messages.description, robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang={defaultLocale}><body><a className="skip" href="#main">{messages.skip}</a>{children}</body></html>;
}
