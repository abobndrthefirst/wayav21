// Visual stamp/points row for Google Wallet's loyaltyPoints.balance.string.
// Rendered as filled-then-empty circles so customers see each scan fill a
// slot — much more tactile than a bare "3 / 5" number.
//
// Apple handles the visual via strip.png image composition; Google only
// gets a text field for the balance, so we use unicode block characters.

// ⬛ and ⬜ are emoji-class characters — most systems (including Google Wallet)
// render them at emoji size, much bigger and more prominent than the text-size
// circle glyphs we tried first. Space-separated so each square reads as a
// distinct "stamp slot."
const FILLED = "\u2B1B"; // ⬛  large black square
const EMPTY = "\u2B1C";  // ⬜  large white square

/** "⬛ ⬛ ⬛ ⬜ ⬜" for (3, 5). Caps at 10 slots — Google truncates long strings. */
export function stampRow(have: number, need: number): string {
  const cap = Math.min(Math.max(need, 1), 10);
  const filled = Math.min(Math.max(have, 0), cap);
  const slots: string[] = [];
  for (let i = 0; i < filled; i++) slots.push(FILLED);
  for (let i = 0; i < cap - filled; i++) slots.push(EMPTY);
  return slots.join(" ");
}

/** Bilingual "N more stamps until reward" / "reward ready" message. */
export function stampProgressMessage(
  have: number,
  need: number,
  rewardTitle: string,
  rewardsBalance: number,
  lang: "en" | "ar",
): string {
  if (rewardsBalance > 0) {
    return lang === "ar"
      ? `🎁 مكافأتك جاهزة! ${rewardTitle}`
      : `🎁 Your ${rewardTitle} is ready!`;
  }
  const remaining = Math.max(0, need - have);
  if (remaining === 0) {
    return lang === "ar"
      ? `🎁 مكافأتك جاهزة! ${rewardTitle}`
      : `🎁 Your ${rewardTitle} is ready!`;
  }
  if (lang === "ar") {
    return `باقي ${remaining} ${remaining === 1 ? "ختم" : "أختام"} للحصول على ${rewardTitle}`;
  }
  return `You are ${remaining} stamp${remaining === 1 ? "" : "s"} away from your ${rewardTitle}`;
}
