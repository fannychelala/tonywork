export const screens = ["today", "opportunities", "contacts", "services", "settings"] as const;
export type Screen = typeof screens[number];
export function isScreen(value: string): value is Screen { return (screens as readonly string[]).includes(value); }
