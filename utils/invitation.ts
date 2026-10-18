/**
 * Helper utilities for generating wedding invitation URLs, QR code links, and WhatsApp sharing templates.
 *
 * Ensures all invitations strictly follow Format #2:
 * https://weddingofandricica.me/[GuestName]?code=[Code]
 * Example: https://weddingofandricica.me/Yuda?code=42507
 */

export const DEFAULT_SITE_URL = "https://weddingofandricica.me";

/**
 * Returns the base site URL without trailing slash.
 */
export function getSiteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
  ).replace(/\/+$/, "");
}

/**
 * Builds the canonical public invitation URL (Format #2):
 * https://weddingofandricica.me/[GuestName]?code=[Code]
 *
 * Fallbacks gracefully if name or code is missing.
 */
export function buildInvitationUrl(
  name?: string | null,
  code?: string | null
): string {
  const baseUrl = getSiteBaseUrl();
  const cleanCode = (code || "").trim();
  const cleanName = (name || "").trim();

  if (cleanName && cleanCode) {
    return `${baseUrl}/${encodeURIComponent(cleanName)}?code=${encodeURIComponent(cleanCode)}`;
  }
  if (cleanName) {
    return `${baseUrl}/${encodeURIComponent(cleanName)}`;
  }
  if (cleanCode) {
    return `${baseUrl}?code=${encodeURIComponent(cleanCode)}`;
  }
  return `${baseUrl}/guest`;
}

/**
 * Builds the relative route for Next.js internal Link navigation:
 * /[GuestName]?code=[Code]
 */
export function buildInvitationPath(
  name?: string | null,
  code?: string | null
): string {
  const cleanCode = (code || "").trim();
  const cleanName = (name || "").trim();

  if (cleanName && cleanCode) {
    return `/${encodeURIComponent(cleanName)}?code=${encodeURIComponent(cleanCode)}`;
  }
  if (cleanName) {
    return `/${encodeURIComponent(cleanName)}`;
  }
  if (cleanCode) {
    return `/?code=${encodeURIComponent(cleanCode)}`;
  }
  return "/guest";
}


/**
 * Formats a phone number for WhatsApp international standard (e.g. 0812... -> 62812...).
 */
export function formatWhatsappNumber(phoneStr: string): string {
  const clean = (phoneStr || "").replace(/\D/g, "");
  if (clean.startsWith("0")) {
    return "62" + clean.slice(1);
  }
  if (clean.startsWith("8")) {
    return "62" + clean;
  }
  return clean;
}

/**
 * Generates the full WhatsApp send URL with personalized greeting and Format #2 invitation URL.
 */
export function buildWhatsappShareUrl(
  phone: string,
  name: string,
  code: string,
  inviteUrl?: string
): string {
  const cleanPhone = formatWhatsappNumber(phone);
  const finalInviteUrl = inviteUrl || buildInvitationUrl(name, code);

  const text = `Kepada Yth. *${name}*,

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada pernikahan kami:

*The Wedding of Andri & Cica*
📅 Sabtu, 21 November 2026

Berikut tautan undangan digital dan tiket check-in reservasi Anda:
🔗 ${finalInviteUrl}

*Kode Reservasi Masuk:* *${code}*
(Tunjukkan QR Code di undangan ini saat tiba di meja penerima tamu).

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir. Terima kasih.

Salam hangat,
*Andri & Cica*`;

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
}
