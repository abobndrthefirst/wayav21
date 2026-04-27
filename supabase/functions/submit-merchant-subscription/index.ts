// submit-merchant-subscription — public endpoint for the /subscribe page.
//
// Flow:
//   1. Validate the form input server-side (mirrors client-side checks).
//   2. If a referral_code is provided, look it up in public.marketers
//      via an inline service-role query and capture the marketer_id.
//      Reject with a field-specific error if the code doesn't exist.
//   3. Insert into public.merchant_subscriptions with status='pending'.
//      Admin reviews and updates status to 'active' in Supabase Studio,
//      which fires the auto-create-commission trigger from migration 03.
//
// Public endpoint: verify_jwt = false in supabase/config.toml. CORS via
// the shared allowlist.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { normalizeKsaPhone, ValidationError } from "../_shared/validation.ts";

interface Payload {
  business_name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  business_category?: string;
  referral_code?: string | null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REFERRAL_CODE_RE = /^[A-Z]{4}$/;

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return preflightResponse(req, "POST, OPTIONS");

  try {
    const body = (await req.json()) as Payload;

    const businessName = (body.business_name ?? "").trim();
    if (businessName.length < 2 || businessName.length > 120) {
      throw new ValidationError("اسم النشاط مطلوب.", "business_name");
    }

    const contactName = (body.contact_name ?? "").trim();
    if (contactName.length < 2 || contactName.length > 80) {
      throw new ValidationError("اسم المسؤول مطلوب.", "contact_name");
    }

    const phone = normalizeKsaPhone(body.phone);
    if (!phone) {
      throw new ValidationError("رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.", "phone");
    }

    const email = (body.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new ValidationError("البريد الإلكتروني غير صحيح.", "email");
    }

    const city = (body.city ?? "").trim();
    if (city.length < 2 || city.length > 60) {
      throw new ValidationError("المدينة مطلوبة.", "city");
    }

    const category = (body.business_category ?? "").trim();
    if (category.length < 2 || category.length > 60) {
      throw new ValidationError("نوع النشاط مطلوب.", "business_category");
    }

    let referralCode: string | null = null;
    const rawCode = (body.referral_code ?? "").trim().toUpperCase();
    if (rawCode.length > 0) {
      if (!REFERRAL_CODE_RE.test(rawCode)) {
        throw new ValidationError("كود المسوّق يجب أن يكون 4 أحرف إنجليزية.", "referral_code");
      }
      referralCode = rawCode;
    }

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    let marketerId: string | null = null;
    if (referralCode) {
      const { data: marketer } = await svc
        .from("marketers")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();
      if (!marketer) {
        throw new ValidationError(
          "كود المسوّق غير صحيح. يرجى التأكد من الكود أو ترك الحقل فارغاً.",
          "referral_code",
        );
      }
      marketerId = marketer.id;
    }

    const { data: inserted, error: insertErr } = await svc
      .from("merchant_subscriptions")
      .insert({
        business_name: businessName,
        contact_name: contactName,
        phone,
        email,
        city,
        business_category: category,
        referral_code: referralCode,
        marketer_id: marketerId,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      throw new Error(insertErr?.message || "تعذّر حفظ الاشتراك.");
    }

    return new Response(
      JSON.stringify({ success: true, subscription_id: inserted.id }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const isValidation = err instanceof ValidationError;
    const msg = (err as Error).message;
    const field = isValidation ? (err as ValidationError).field : undefined;
    return new Response(
      JSON.stringify({ success: false, error: msg, field }),
      {
        status: isValidation ? 400 : 500,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }
});
