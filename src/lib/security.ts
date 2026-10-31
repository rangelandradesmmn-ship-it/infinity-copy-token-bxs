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
 * Cleans and extracts the local phone number with DDD/area code, stripping redundant country codes.
 */
export function cleanLocalPhoneNumber(countryCode: string, number: string): string {
  const cleanCode = (countryCode || '+55').replace(/\D/g, '');
  let digits = (number || '').replace(/\D/g, '');
  if (!digits) return '';

  // Max local length by country (Brazil: 11, USA: 10, Portugal: 9, Spain: 9, UK: 11)
  const maxLocalLength =
    cleanCode === '1' ? 10 : cleanCode === '351' || cleanCode === '34' ? 9 : 11;

  // Strip repeated country codes at start (e.g. 5555... or 555555...)
  while (cleanCode && digits.startsWith(cleanCode) && digits.length > maxLocalLength) {
    digits = digits.slice(cleanCode.length);
  }

  // If digits still starts with cleanCode and exceeds local length, strip one cleanCode
  if (cleanCode && digits.startsWith(cleanCode) && digits.length > maxLocalLength) {
    digits = digits.slice(cleanCode.length);
  }

  return digits;
}

/**
 * Sanitizes phone number by keeping only digits and ensures proper international format without duplicate country codes.
 */
export function sanitizePhoneNumber(countryCode: string, number: string): string {
  const cleanCode = (countryCode || '+55').replace(/\D/g, '');
  const localNumber = cleanLocalPhoneNumber(countryCode, number);
  if (!localNumber) return '';
  return `${cleanCode}${localNumber}`;
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
