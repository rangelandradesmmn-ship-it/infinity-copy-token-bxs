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

export interface CountryOption {
  code: string;
  name: string;
  maxLen: number;
  placeholder: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: '+55', name: 'Brasil (+55)', maxLen: 11, placeholder: 'Ex: 11999998888' },
  { code: '+591', name: 'Bolívia (+591)', maxLen: 8, placeholder: 'Ex: 76846913' },
  { code: '+1', name: 'Estados Unidos / Canadá (+1)', maxLen: 10, placeholder: 'Ex: 2025550143' },
  { code: '+351', name: 'Portugal (+351)', maxLen: 9, placeholder: 'Ex: 912345678' },
  { code: '+34', name: 'Espanha (+34)', maxLen: 9, placeholder: 'Ex: 612345678' },
  { code: '+54', name: 'Argentina (+54)', maxLen: 10, placeholder: 'Ex: 91123456789' },
  { code: '+595', name: 'Paraguai (+595)', maxLen: 9, placeholder: 'Ex: 981234567' },
  { code: '+598', name: 'Uruguai (+598)', maxLen: 8, placeholder: 'Ex: 99123456' },
  { code: '+56', name: 'Chile (+56)', maxLen: 9, placeholder: 'Ex: 912345678' },
  { code: '+51', name: 'Peru (+51)', maxLen: 9, placeholder: 'Ex: 912345678' },
  { code: '+57', name: 'Colômbia (+57)', maxLen: 10, placeholder: 'Ex: 3001234567' },
  { code: '+52', name: 'México (+52)', maxLen: 10, placeholder: 'Ex: 5512345678' },
  { code: '+593', name: 'Equador (+593)', maxLen: 9, placeholder: 'Ex: 991234567' },
  { code: '+58', name: 'Venezuela (+58)', maxLen: 10, placeholder: 'Ex: 4121234567' },
  { code: '+44', name: 'Reino Unido (+44)', maxLen: 11, placeholder: 'Ex: 7911123456' },
  { code: '+39', name: 'Itália (+39)', maxLen: 10, placeholder: 'Ex: 3123456789' },
  { code: '+33', name: 'França (+33)', maxLen: 9, placeholder: 'Ex: 612345678' },
  { code: '+49', name: 'Alemanha (+49)', maxLen: 11, placeholder: 'Ex: 15123456789' },
  { code: '+41', name: 'Suíça (+41)', maxLen: 9, placeholder: 'Ex: 781234567' },
  { code: '+81', name: 'Japão (+81)', maxLen: 10, placeholder: 'Ex: 9012345678' },
  { code: '+244', name: 'Angola (+244)', maxLen: 9, placeholder: 'Ex: 923123456' },
  { code: '+258', name: 'Moçambique (+258)', maxLen: 9, placeholder: 'Ex: 841234567' },
  { code: '+61', name: 'Austrália (+61)', maxLen: 9, placeholder: 'Ex: 412345678' },
  { code: '+971', name: 'Emirados Árabes (+971)', maxLen: 9, placeholder: 'Ex: 501234567' },
];

export const COUNTRY_MAX_LENGTH: Record<string, number> = {
  '55': 11,
  '591': 8,
  '1': 10,
  '351': 9,
  '34': 9,
  '54': 10,
  '595': 9,
  '598': 8,
  '56': 9,
  '51': 9,
  '57': 10,
  '52': 10,
  '593': 9,
  '58': 10,
  '44': 11,
  '39': 10,
  '33': 9,
  '49': 11,
  '41': 9,
  '81': 10,
  '244': 9,
  '258': 9,
  '61': 9,
  '971': 9,
};

/**
 * Cleans and extracts the local phone number with DDD/area code, stripping redundant country codes.
 */
export function cleanLocalPhoneNumber(countryCode: string, number: string): string {
  const cleanCode = (countryCode || '+55').replace(/\D/g, '');
  let digits = (number || '').replace(/\D/g, '');
  if (!digits) return '';

  const maxLocalLength = COUNTRY_MAX_LENGTH[cleanCode] || 11;

  // Strip repeated country codes at start (e.g. 5555... or 591591... or 59176846913)
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

/**
 * Validates whether a submitted URL corresponds to an authentic, public social media publication.
 * Supported platforms: Facebook, Instagram, X (Twitter), LinkedIn, TikTok, YouTube, Threads, Telegram, etc.
 */
export function validateSocialPostUrl(urlString: string): {
  isValid: boolean;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'threads' | 'telegram' | 'other';
  isPublic: boolean;
  error?: string;
} {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, platform: 'other', isPublic: false, error: 'Por favor, informe a URL da publicação.' };
  }

  const trimmed = urlString.trim();
  if (!/^https:\/\/[^/]+/i.test(trimmed)) {
    return {
      isValid: false,
      platform: 'other',
      isPublic: false,
      error: 'A URL deve ser um link público e seguro iniciado com https://',
    };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname;

    // Reject localhost, internal IPs
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return { isValid: false, platform: 'other', isPublic: false, error: 'Endereço local não permitido.' };
    }

    // 1. Facebook
    if (host.includes('facebook.com') || host.includes('fb.watch') || host.includes('fb.com')) {
      const isPublicPost =
        pathname.includes('/posts/') ||
        pathname.includes('/watch') ||
        pathname.includes('/reel/') ||
        pathname.includes('/share/p/') ||
        pathname.includes('permalink.php') ||
        pathname.includes('photo.php') ||
        parsed.searchParams.has('story_fbid');

      if (!isPublicPost && pathname.length <= 1) {
        return { isValid: false, platform: 'facebook', isPublic: false, error: 'Informe o link direto do post/vídeo no Facebook, não a página inicial.' };
      }
      return { isValid: true, platform: 'facebook', isPublic: true };
    }

    // 2. Instagram
    if (host.includes('instagram.com')) {
      const isPost = pathname.includes('/p/') || pathname.includes('/reel/') || pathname.includes('/reels/') || pathname.includes('/tv/');
      if (!isPost) {
        return { isValid: false, platform: 'instagram', isPublic: false, error: 'Informe o link direto do post ou reel público no Instagram (/p/ ou /reel/).' };
      }
      return { isValid: true, platform: 'instagram', isPublic: true };
    }

    // 3. X / Twitter
    if (host.includes('twitter.com') || host.includes('x.com')) {
      const isTweet = pathname.includes('/status/');
      if (!isTweet) {
        return { isValid: false, platform: 'twitter', isPublic: false, error: 'Informe o link direto do tweet/post no X/Twitter (/status/...).' };
      }
      return { isValid: true, platform: 'twitter', isPublic: true };
    }

    // 4. LinkedIn
    if (host.includes('linkedin.com')) {
      const isPost = pathname.includes('/posts/') || pathname.includes('/feed/update/') || pathname.includes('/pulse/');
      if (!isPost) {
        return { isValid: false, platform: 'linkedin', isPublic: false, error: 'Informe o link direto da publicação no LinkedIn (/posts/...).' };
      }
      return { isValid: true, platform: 'linkedin', isPublic: true };
    }

    // 5. TikTok
    if (host.includes('tiktok.com')) {
      const isVideo = pathname.includes('/video/') || pathname.includes('/v/');
      if (!isVideo && pathname.length <= 1) {
        return { isValid: false, platform: 'tiktok', isPublic: false, error: 'Informe o link direto do vídeo no TikTok.' };
      }
      return { isValid: true, platform: 'tiktok', isPublic: true };
    }

    // 6. YouTube
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const isVideo = pathname.includes('/watch') || pathname.includes('/shorts/') || pathname.includes('/community') || host.includes('youtu.be');
      if (!isVideo) {
        return { isValid: false, platform: 'youtube', isPublic: false, error: 'Informe o link do vídeo, short ou post da comunidade no YouTube.' };
      }
      return { isValid: true, platform: 'youtube', isPublic: true };
    }

    // 7. Threads
    if (host.includes('threads.net')) {
      const isPost = pathname.includes('/post/') || pathname.includes('/t/');
      if (!isPost) {
        return { isValid: false, platform: 'threads', isPublic: false, error: 'Informe o link direto da publicação no Threads.' };
      }
      return { isValid: true, platform: 'threads', isPublic: true };
    }

    // 8. Telegram
    if (host.includes('t.me')) {
      const isPost = pathname.split('/').filter(Boolean).length >= 2;
      return { isValid: true, platform: 'telegram', isPublic: isPost };
    }

    return {
      isValid: false,
      platform: 'other',
      isPublic: false,
      error: 'A URL informada deve pertencer a uma rede social suportada (Facebook, Instagram, X/Twitter, YouTube, LinkedIn, TikTok, Threads ou Telegram).',
    };
  } catch {
    return { isValid: false, platform: 'other', isPublic: false, error: 'URL inválida.' };
  }
}

/**
 * Validates a BNB Smart Chain (BEP-20) wallet address.
 * Standard format: '0x' followed by 40 hexadecimal characters.
 */
export function isValidBscWalletAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}
