/**
 * Quick-contact number: +91 99864 18638 (India). Used for the WhatsApp button
 * and the "Call" link. Override with NEXT_PUBLIC_WHATSAPP_E164 (E.164, digits
 * only, no "+") to point the site at a different number without a code change.
 */
function digits(value: string) {
  return value.replace(/\D/g, "");
}

/** E.164 without "+": country code 91 + 9986418638. */
export const DEFAULT_CONTACT_E164 = "919986418638";

/** Obvious placeholders that must never go live if someone sets them. */
const PLACEHOLDER_NUMBERS = new Set([
  "910000000000",
  "91xxxxxxxxxx",
  "1234567890",
]);

/**
 * Pure so it can be tested. `raw` is NEXT_PUBLIC_WHATSAPP_E164. A configured,
 * plausible, non-placeholder number wins; otherwise the default above is used.
 */
export function resolveWhatsappNumber(raw: string | undefined) {
  const configured = digits(raw || "");
  const valid =
    configured.length >= 8 &&
    configured.length <= 15 &&
    !PLACEHOLDER_NUMBERS.has(configured);
  return valid ? configured : DEFAULT_CONTACT_E164;
}

export const WHATSAPP_E164 = resolveWhatsappNumber(
  process.env.NEXT_PUBLIC_WHATSAPP_E164
);

/** Display form and tel: link for the same number. */
export function phoneDisplay(e164: string = WHATSAPP_E164) {
  if (e164.startsWith("91") && e164.length === 12) {
    return `+91 ${e164.slice(2, 7)} ${e164.slice(7)}`;
  }
  return `+${e164}`;
}

export function phoneHref(e164: string = WHATSAPP_E164) {
  return `tel:+${e164}`;
}

export function whatsappEnabled() {
  return WHATSAPP_E164.length > 0;
}

export const WHATSAPP_DEFAULT_GREETING =
  "Hi, I would like to learn more about your services. I understand I should not send medical records or other sensitive documents through WhatsApp.";

/**
 * https://wa.me/<number>?text=<encoded message>
 * Opens the native app on phones and WhatsApp Web / Desktop on computers.
 * Pass the greeting for the visitor's selected language.
 */
export function whatsappHref(prefill?: string, number: string = WHATSAPP_E164) {
  if (!number) return "";
  const text = encodeURIComponent(prefill || WHATSAPP_DEFAULT_GREETING);
  return `https://wa.me/${number}?text=${text}`;
}

export const SITE = {
  name: "Doctor's Credit",
  short: "DCredit",
  domain: "dcredit.in",
  city: "Hyderabad",
  tagline: "Know your options before you decide.",
  promise:
    "We help international patients understand whether planned treatment in India may be worth investigating for their particular situation.",
  email: "care@dcredit.in",
  founders: {
    him: {
      name: "Akashdeep Sadhu",
      role: "Co-founder",
      image: "/founders/akashdeep.jpg",
      initials: "AS",
    },
    her: {
      name: "Co-founder",
      role: "Co-founder",
      image: "/founders/partner.jpg",
      initials: "DC",
      note: "Name and portrait to be placed when you send them.",
    },
  },
} as const;

export const DISCLAIMER =
  "DCredit is an international planned-care decision and coordination platform. We are not a hospital, physician, insurer, emergency medical service or diagnostic service. Information on this website is educational and for coordination. It is not medical advice, diagnosis, treatment or medical clearance. The current $5 Initial Assessment is a conversation with DCredit, not a clinical assessment, specialist opinion, insurance verification or medical-record review. DCredit does not currently operate a medical-record vault. Treatment decisions must be made between you and qualified healthcare professionals. Costs, availability, treatment plans, outcomes and travel requirements vary. No medical outcome or savings are guaranteed. Always consult your own healthcare professionals and, where relevant, your insurer or funding body before making decisions about cross-border care. Health-privacy rules differ by country. For example, in the United States, this website does not claim HIPAA compliance.";
