export const fr = {
 name: "Tony",
 description: "L’assistant qui transforme vos demandes en opportunités.",
 eyebrow: "Votre futur assistant commercial",
 title: "Pendant que vous travaillez, Tony prépare la suite.",
 intro: "Récupérer les demandes. Comprendre les besoins. Vous aider à rappeler les bonnes personnes au bon moment.",
 status: "En développement local",
 foundation: "Les fondations sont posées.",
 detail: "Cette première étape prépare une expérience simple, fiable et pensée pour le terrain.",
 note: "Aucune demande réelle n’est collectée à ce stade.",
 skip: "Aller au contenu",
} as const;
type Messages = { [Key in keyof typeof fr]: string };
export const en: Messages = {
 name: "Tony", description: "The assistant that turns enquiries into opportunities.",
 eyebrow: "Your future business assistant", title: "While you work, Tony prepares what comes next.",
 intro: "Capture enquiries. Understand needs. Help you call the right people at the right time.",
 status: "In local development", foundation: "The foundations are in place.",
 detail: "This first step prepares a simple, reliable experience built for field work.",
 note: "No real enquiries are collected at this stage.", skip: "Skip to content",
};
export const dictionaries = { "fr-FR": fr, "en-GB": en } satisfies Record<string, Messages>;
export type Locale = keyof typeof dictionaries;
export const defaultLocale: Locale = "fr-FR";
