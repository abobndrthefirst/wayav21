// Input validation for public-facing edge functions.
// Keep rules centralized so every endpoint enforces the same contract.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// KSA mobile: +9665XXXXXXXX, 9665XXXXXXXX, or 05XXXXXXXX (normalized client-side but we accept all)
const KSA_PHONE_RE = /^(?:\+?966|0)?5\d{8}$/;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export function normalizeKsaPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/[^\d+]/g, "");
  if (!KSA_PHONE_RE.test(digits)) return null;
  // Normalize to +9665XXXXXXXX
  const bare = digits.replace(/^\+?966/, "").replace(/^0/, "");
  return `+966${bare}`;
}

export function isValidName(v: unknown): v is string {
  return typeof v === "string" && v.trim().length >= 1 && v.trim().length <= 80;
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export interface EnrollmentInput {
  program_id: string;
  customer_name: string;
  customer_phone: string;
}

export function parseEnrollmentInput(body: any): EnrollmentInput {
  if (!body || typeof body !== "object") throw new ValidationError("Missing body");
  const { program_id, customer_name, customer_phone } = body;
  if (!isUuid(program_id)) throw new ValidationError("Invalid program_id (must be UUID)", "program_id");
  if (!isValidName(customer_name)) throw new ValidationError("Invalid customer_name (1-80 chars)", "customer_name");
  const phone = normalizeKsaPhone(customer_phone);
  if (!phone) throw new ValidationError("Invalid customer_phone (KSA mobile required)", "customer_phone");
  return {
    program_id,
    customer_name: customer_name.trim().slice(0, 80),
    customer_phone: phone,
  };
}
