// Waya signature is applied to every pass, merchants cannot remove it.
// Kept in one place so Apple + Google can't drift.

import { labelFor } from "./passLabels.ts";

export function appleSignatureBackField(lang: "en" | "ar") {
  return {
    key: "waya_sig",
    label: labelFor(lang, "POWERED_BY"),
    value: labelFor(lang, "WAYA_TAG"),
    attributedValue: `<a href='https://trywaya.com'>${labelFor(lang, "WAYA_TAG")}</a>`,
  };
}

export function googleSignatureTextModule(lang: "en" | "ar") {
  return {
    id: "waya_sig",
    header: labelFor(lang, "POWERED_BY"),
    body: labelFor(lang, "WAYA_TAG"),
  };
}

export function googleSignatureLink() {
  return {
    uri: "https://trywaya.com",
    description: "Waya",
  };
}

export function passDescription(programName: string): string {
  const name = (programName || "Loyalty").trim();
  return `${name} · Waya pass (trywaya.com)`;
}
