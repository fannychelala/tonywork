import { dictionaries, defaultLocale } from "@/shared/i18n/messages";
export default function Home() {
 const t = dictionaries[defaultLocale];
 return <div className="frame">
  <header><span className="wordmark">{t.name}</span><span className="status">{t.status}</span></header>
  <main id="main" tabIndex={-1}>
   <p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="intro">{t.intro}</p>
   <section className="foundation" aria-labelledby="foundation-title"><h2 id="foundation-title">{t.foundation}</h2><p>{t.detail}</p></section>
  </main><footer>{t.note}</footer>
 </div>;
}
