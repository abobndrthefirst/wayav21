// Admin-only edge function that calls Google Gemini to generate a card-design
// theme + background image from a free-text prompt.
//
// Two-call flow (more reliable than mixing modalities in one request):
//   1. gemini-2.5-flash with responseSchema → structured theme JSON
//   2. gemini-2.5-flash-image (Nano Banana) → 1125x432-ish background PNG
//
// Both models are on Google AI Studio's free tier as of 2026-04. Quotas reset
// daily. We don't retry on 429 — the client surfaces the error and the admin
// waits or rotates keys.
//
// Auth: caller must hold a JWT whose subject is on public.platform_admins.
// We reuse is_platform_admin() so there's no second source of truth.
//
// Rate limit: 1 req / 2s per user ID (the IP-based limiter would over-throttle
// if the admin tabs around rapidly).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { verifyUser } from "../_shared/auth.ts";
import { rateLimit, rateLimitHeaders } from "../_shared/rateLimit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

// Models — overridable via env without redeploying code.
const TEXT_MODEL  = Deno.env.get("GEMINI_TEXT_MODEL")  || "gemini-2.5-flash";
const IMAGE_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") || "gemini-2.5-flash-image";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

interface Theme {
  card_color: string;
  text_color: string;
  gradient: { from: string; to: string; angle: number };
  accent: string;
}

interface GenerateResult {
  theme: Theme;
  suggestedName: string;
  imageBase64: string;
  imageMimeType: string;
}

function jsonResponse(req: Request, body: unknown, status = 200, extra: Record<string,string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeadersFor(req),
      ...extra,
    },
  });
}

function isHex(s: unknown): s is string {
  return typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s);
}

function validateTheme(t: any): Theme {
  if (!t || typeof t !== "object") throw new Error("theme is not an object");
  if (!isHex(t.card_color)) throw new Error("theme.card_color must be #RRGGBB");
  if (!isHex(t.text_color)) throw new Error("theme.text_color must be #RRGGBB");
  if (!t.gradient || typeof t.gradient !== "object") throw new Error("theme.gradient missing");
  if (!isHex(t.gradient.from)) throw new Error("theme.gradient.from must be #RRGGBB");
  if (!isHex(t.gradient.to))   throw new Error("theme.gradient.to must be #RRGGBB");
  const angle = Number(t.gradient.angle);
  if (!Number.isFinite(angle) || angle < 0 || angle > 360) {
    throw new Error("theme.gradient.angle must be 0-360");
  }
  if (!isHex(t.accent)) throw new Error("theme.accent must be #RRGGBB");
  return {
    card_color: t.card_color,
    text_color: t.text_color,
    gradient:   { from: t.gradient.from, to: t.gradient.to, angle },
    accent:     t.accent,
  };
}

async function callGeminiText(prompt: string, stylePreset?: string): Promise<{ theme: Theme; suggestedName: string }> {
  const sysPreamble =
    "You are a senior product designer at a fintech company. Given a user prompt for a loyalty-card aesthetic, " +
    "return ONLY a JSON object describing a Revolut/Neo-bank-grade card theme. " +
    "Pick contrasting text on the card_color (WCAG AA at minimum). " +
    "Pick a tasteful gradient that matches the brief. Keep accent within the same hue family.";
  const userPrompt = stylePreset
    ? `Style preset: ${stylePreset}. Brief: ${prompt}`
    : prompt;

  const body = {
    systemInstruction: { parts: [{ text: sysPreamble }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          card_color:    { type: "string", description: "Primary background color, hex #RRGGBB" },
          text_color:    { type: "string", description: "Primary text color, hex #RRGGBB" },
          gradient: {
            type: "object",
            properties: {
              from:  { type: "string" },
              to:    { type: "string" },
              angle: { type: "number" },
            },
            required: ["from", "to", "angle"],
          },
          accent:         { type: "string", description: "Accent color, hex #RRGGBB" },
          suggestedName:  { type: "string", description: "Short evocative template name, e.g. 'Midnight Aurora'" },
        },
        required: ["card_color", "text_color", "gradient", "accent", "suggestedName"],
      },
      temperature: 0.9,
    },
  };

  const url = `${GEMINI_BASE}/models/${TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini text ${res.status}: ${txt.slice(0, 400)}`);
  }
  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof raw !== "string") throw new Error("Gemini text: empty response");
  let parsed: any;
  try { parsed = JSON.parse(raw); }
  catch (e) { throw new Error(`Gemini text JSON parse failed: ${raw.slice(0, 200)}`); }

  const theme = validateTheme(parsed);
  const suggestedName = typeof parsed.suggestedName === "string" && parsed.suggestedName.trim()
    ? parsed.suggestedName.trim().slice(0, 60)
    : "Untitled Design";
  return { theme, suggestedName };
}

async function callGeminiImage(prompt: string, theme: Theme, stylePreset?: string): Promise<{ base64: string; mimeType: string }> {
  // Tell the image model what colors to honor, otherwise it drifts off-palette.
  const richPrompt = [
    "Generate a single horizontal banner image, ~1125x432 aspect, suitable as a loyalty-card cover/strip.",
    "No text, no logos, no people, no brand marks. Premium fintech aesthetic.",
    stylePreset ? `Style: ${stylePreset}.` : null,
    `Brief: ${prompt}`,
    `Color palette must align with: card ${theme.card_color}, gradient ${theme.gradient.from} → ${theme.gradient.to}, accent ${theme.accent}.`,
    "High polish, modern, abstract — like Revolut, Monzo, or a neo-bank metal card.",
  ].filter(Boolean).join(" ");

  const body = {
    contents: [{ role: "user", parts: [{ text: richPrompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const url = `${GEMINI_BASE}/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini image ${res.status}: ${txt.slice(0, 400)}`);
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const inline = parts.find((p: any) => p?.inlineData?.data)?.inlineData;
  if (!inline?.data) throw new Error("Gemini image: no inlineData in response");
  return { base64: inline.data, mimeType: inline.mimeType || "image/png" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflightResponse(req);
  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }
  if (!GEMINI_API_KEY) {
    return jsonResponse(req, { error: "GEMINI_API_KEY not set on the function" }, 500);
  }

  // 1. Auth
  let user;
  try { user = await verifyUser(req); }
  catch (e) {
    return jsonResponse(req, { error: "Unauthorized" }, 401);
  }

  // 2. Admin gate (single source of truth: public.platform_admins)
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: { headers: { Authorization: req.headers.get("authorization") || "" } },
    auth:   { persistSession: false, autoRefreshToken: false },
  });
  const { data: isAdmin, error: adminErr } = await sb.rpc("is_platform_admin");
  if (adminErr) {
    console.error("[admin-design-studio] is_platform_admin failed:", adminErr);
    return jsonResponse(req, { error: "Admin check failed" }, 500);
  }
  if (isAdmin !== true) {
    return jsonResponse(req, { error: "Forbidden" }, 403);
  }

  // 3. Rate limit (per-user, generous — admin workflow is single-operator)
  const rl = await rateLimit("rl:admin-design-studio", `u:${user.id}`, 30, 60_000);
  if (!rl.allowed) {
    return jsonResponse(req, { error: "Rate limited" }, 429, rateLimitHeaders(rl));
  }

  // 4. Body
  let body: any;
  try { body = await req.json(); }
  catch { return jsonResponse(req, { error: "Body must be JSON" }, 400); }
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const stylePreset = typeof body?.stylePreset === "string" ? body.stylePreset.trim().slice(0, 80) : undefined;
  if (!prompt) return jsonResponse(req, { error: "prompt is required" }, 400);
  if (prompt.length > 600) return jsonResponse(req, { error: "prompt too long (max 600 chars)" }, 400);

  // 5. Generate (theme first; image generation conditioned on theme palette)
  let theme: Theme;
  let suggestedName: string;
  try {
    const t = await callGeminiText(prompt, stylePreset);
    theme = t.theme; suggestedName = t.suggestedName;
  } catch (e) {
    console.error("[admin-design-studio] text gen failed:", e);
    return jsonResponse(req, { error: `Theme generation failed: ${(e as Error).message}` }, 502);
  }

  let imageBase64 = "";
  let imageMimeType = "image/png";
  try {
    const img = await callGeminiImage(prompt, theme, stylePreset);
    imageBase64 = img.base64; imageMimeType = img.mimeType;
  } catch (e) {
    // Image is the slower / quota-heavier call. If it fails we still return
    // the theme so the admin can manually upload a background.
    console.error("[admin-design-studio] image gen failed:", e);
  }

  const result: GenerateResult = { theme, suggestedName, imageBase64, imageMimeType };
  return jsonResponse(req, result, 200, rateLimitHeaders(rl));
});
