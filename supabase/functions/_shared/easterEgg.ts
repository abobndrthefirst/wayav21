// GNKJ — four legendary gaming protagonists hidden on every pass.
// Layer 1: visible back field "Legendary" with hero assigned per serial.
// Layer 3: non-standard "$credits" field at root of pass.json.
// Fans will smile, no one else notices. Merchants cannot see or change it.
//
// The hero assignment is derived from sha1(serial) so the same pass always
// gets the same hero — no DB column needed.

const HEROES = [
  { id: "G", name: "Geralt", tierEn: "Witcher Tier", tierAr: "مستوى الساحر" },
  { id: "N", name: "Nathan", tierEn: "Explorer Tier", tierAr: "مستوى المغامر" },
  { id: "K", name: "Kratos", tierEn: "Spartan Tier", tierAr: "مستوى الإسبرطي" },
  { id: "J", name: "Joel", tierEn: "Survivor Tier", tierAr: "مستوى الناجي" },
] as const;

async function sha1Int(input: string): Promise<number> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", bytes);
  const view = new Uint8Array(buf);
  // Top byte mod 4 → 0..3
  return view[0] % HEROES.length;
}

export async function pickHero(seed: string) {
  const idx = await sha1Int(seed || "waya");
  return HEROES[idx];
}

export function legendaryLabel(lang: "en" | "ar"): string {
  return lang === "ar" ? "أسطورة" : "Legendary";
}

export function legendaryValue(hero: { name: string; tierEn: string; tierAr: string }, lang: "en" | "ar"): string {
  return lang === "ar" ? `${hero.name} · ${hero.tierAr}` : `${hero.name} · ${hero.tierEn}`;
}

export const CREDITS_STRING =
  "GNKJ · Geralt · Nathan · Kratos · Joel · Legends never die.";
