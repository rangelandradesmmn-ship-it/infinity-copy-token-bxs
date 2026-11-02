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

/**
 * Converts various video platform URLs (YouTube Shorts, Watch, youtu.be, Live, Vimeo)
 * into a safe, valid embeddable iframe URL.
 */
export function formatVideoEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();

  // If user pasted an iframe embed snippet: extract src attribute
  if (trimmed.includes('<iframe')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      trimmed = srcMatch[1].trim();
    }
  }

  // 1. YouTube Shorts: youtube.com/shorts/<id>
  const shortsMatch = trimmed.match(/(?:youtube\.com|youtu\.be)\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}?rel=0&modestbranding=1`;
  }

  // 2. YouTube Live: youtube.com/live/<id>
  const liveMatch = trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/i);
  if (liveMatch && liveMatch[1]) {
    return `https://www.youtube.com/embed/${liveMatch[1]}?rel=0&modestbranding=1`;
  }

  // 3. YouTube Embed: youtube.com/embed/<id>
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i);
  if (embedMatch && embedMatch[1]) {
    return `https://www.youtube.com/embed/${embedMatch[1]}?rel=0&modestbranding=1`;
  }

  // 4. YouTube Watch: youtube.com/watch?v=<id>
  if (trimmed.includes('youtube.com/watch')) {
    const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/i);
    if (vMatch && vMatch[1]) {
      return `https://www.youtube.com/embed/${vMatch[1]}?rel=0&modestbranding=1`;
    }
  }

  // 5. YouTu.be short link: youtu.be/<id>
  const youtuBeMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
  if (youtuBeMatch && youtuBeMatch[1]) {
    return `https://www.youtube.com/embed/${youtuBeMatch[1]}?rel=0&modestbranding=1`;
  }

  // 6. YouTube /v/<id> or /e/<id>
  const vSlashMatch = trimmed.match(/youtube\.com\/(?:v|e)\/([a-zA-Z0-9_-]+)/i);
  if (vSlashMatch && vSlashMatch[1]) {
    return `https://www.youtube.com/embed/${vSlashMatch[1]}?rel=0&modestbranding=1`;
  }

  // 7. Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return trimmed;
}
