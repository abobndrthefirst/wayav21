// Bilingual label set for wallet passes. Keyed so both Apple + Google stay
// in sync. If a key is missing from `ar`, the en value is used as fallback.

export type PassLang = "en" | "ar" | "auto";

export const LABELS = {
  en: {
    SHOP: "SHOP",
    MEMBER: "MEMBER",
    NAME: "NAME",
    STATUS: "STATUS",
    REWARD: "REWARD",
    REWARDS: "REWARDS",
    STAMPS: "STAMPS",
    POINTS: "POINTS",
    TIER: "TIER",
    OFFER: "OFFER",
    CODE: "CODE",
    PROGRESS: "PROGRESS",
    MEMBER_VALUE: "Member",
    BRONZE: "Bronze",
    TERMS: "Terms & Conditions",
    EXPIRES: "Expires",
    FIND_US: "Find us",
    WEBSITE: "Website",
    PHONE: "Phone",
    ADDRESS: "Address",
    OPEN_IN_MAPS: "Open in Maps",
    POWERED_BY: "Powered by",
    WAYA_TAG: "Waya · trywaya.com",
    REWARD_DESC: "Reward",
    LEGENDARY: "Legendary",
    SCAN_HINT: "Scan to earn",
  },
  ar: {
    SHOP: "المتجر",
    MEMBER: "العضو",
    NAME: "الاسم",
    STATUS: "الحالة",
    REWARD: "المكافأة",
    REWARDS: "المكافآت",
    STAMPS: "الأختام",
    POINTS: "النقاط",
    TIER: "المستوى",
    OFFER: "العرض",
    CODE: "الرمز",
    PROGRESS: "التقدم",
    MEMBER_VALUE: "عضو",
    BRONZE: "برونزي",
    TERMS: "الشروط والأحكام",
    EXPIRES: "ينتهي في",
    FIND_US: "زرنا",
    WEBSITE: "الموقع الإلكتروني",
    PHONE: "الهاتف",
    ADDRESS: "العنوان",
    OPEN_IN_MAPS: "فتح في الخرائط",
    POWERED_BY: "بواسطة",
    WAYA_TAG: "وايا · trywaya.com",
    REWARD_DESC: "المكافأة",
    LEGENDARY: "أسطورة",
    SCAN_HINT: "امسح لكسب النقاط",
  },
} as const;

export type LabelKey = keyof typeof LABELS.en;

export function pickLang(programLang: string | null | undefined, requestLang?: string | null): "en" | "ar" {
  const v = (programLang || "auto").toLowerCase();
  if (v === "en") return "en";
  if (v === "ar") return "ar";
  // auto: look at request Accept-Language or default to en
  const req = (requestLang || "").toLowerCase();
  if (req.startsWith("ar")) return "ar";
  return "en";
}

export function labelFor(lang: "en" | "ar", key: LabelKey): string {
  return LABELS[lang][key] || LABELS.en[key] || key;
}
