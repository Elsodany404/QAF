/*
 * The shop's WhatsApp number. Returns, refunds and cancelling a paid order
 * all go through it: the site never refunds by itself.
 */

/** wa.me format: country code first, no "+". */
export const SHOP_WHATSAPP_NUMBER = "201031200143";
export const SHOP_WHATSAPP_DISPLAY = "+20 103 120 0143";

/** Opens a chat with the shop, with `message` typed in if given. */
export function shopWhatsAppUrl(message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${SHOP_WHATSAPP_NUMBER}${text}`;
}

/**
 * Opens a chat with a customer, from the Egyptian mobile saved with their
 * order (01xxxxxxxxx). Null for a number WhatsApp couldn't reach.
 */
export function customerWhatsAppUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  return /^01\d{9}$/.test(digits) ? `https://wa.me/2${digits}` : null;
}
