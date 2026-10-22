// Datos de contacto del sitio (un solo lugar para cambiarlos).
export const WHATSAPP_NUMBER = "5493517918029"; // +54 9 351 791-8029 (formato wa.me: sin +, con 9)
// Sin emojis: algunos (🎙️ = micrófono + modificador) llegan rotos a WhatsApp Web vía wa.me.
export const WHATSAPP_AUDIO_TEXT = "Hola Ailén, te mando un audio de mi sistema roto.";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_AUDIO_TEXT)}`;
export const CONTACT_EMAIL = "hola@ailensampo.com";

/** WhatsApp con un mensaje propio (sin emojis: llegan rotos vía wa.me). */
export function whatsappUrl(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
