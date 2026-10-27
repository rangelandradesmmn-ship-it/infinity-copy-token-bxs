/**
 * Security and sanitization utilities
 */

/**
 * Validates whether a given URL is a safe, valid HTTPS link
 */
export function isValidHttpsUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const url = new URL(urlString.trim());
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes phone number by keeping only digits and ensures proper international format
 */
export function sanitizePhoneNumber(countryCode: string, number: string): string {
  const cleanCode = (countryCode || '+55').replace(/\D/g, '');
  const cleanNumber = (number || '').replace(/\D/g, '');
  return `${cleanCode}${cleanNumber}`;
}

/**
 * Builds standard WhatsApp click-to-chat URL
 */
export function buildWhatsAppUrl(countryCode: string, number: string, customMessage?: string): string {
  const fullNumber = sanitizePhoneNumber(countryCode, number);
  if (!fullNumber || fullNumber.length < 8) return '';
  const messageParam = customMessage ? `?text=${encodeURIComponent(customMessage.trim())}` : '';
  return `https://wa.me/${fullNumber}${messageParam}`;
}

/**
 * Generates an URL-safe slug from a user name
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-_]/g, '-') // replace invalid chars with hyphen
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // trim hyphens from ends
}

/**
 * Validates an uploaded profile image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato inválido. Apenas imagens JPEG, PNG ou WEBP são permitidas.',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'Arquivo muito grande. O tamanho máximo permitido é de 5MB.',
    };
  }

  return { valid: true };
}

/**
 * Escapes unsafe HTML characters to prevent XSS attacks
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
