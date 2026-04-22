// Visual stamp/points row for Google Wallet's loyaltyPoints.balance.string.
// Rendered as filled-then-empty circles so customers see each scan fill a
// slot — much more tactile than a bare "3 / 5" number.
//
// Apple handles the visual via strip.png image composition; Google only
// gets a text field for the balance, so we use unicode block characters.

const FILLED = "\u25CF"; // ●  solid black circle
const EMPTY = "\u25CB";  // ○  empty circle

/** "●●●○○" for (3, 5). Caps at 12 slots — Google truncates very long strings. */
export function stampRow(have: number, need: number): string {
  const cap = Math.min(Math.max(need, 1), 12);
  const filled = Math.min(Math.max(have, 0), cap);
  return FILLED.repeat(filled) + EMPTY.repeat(cap - filled);
}
