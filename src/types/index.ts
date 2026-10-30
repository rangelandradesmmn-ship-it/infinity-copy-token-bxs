export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'blocked' | 'pending';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  slug: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

export interface UserLandingSettings {
  id: string;
  user_id: string;
  profile_image_url: string;
  registration_url: string;
  whatsapp_country_code: string;
  whatsapp_number: string;
  whatsapp_message: string;
  updated_at: string;
}

export interface UserWithSettings extends UserProfile {
  settings?: UserLandingSettings;
}

export type AspectRatio = '16:9' | '9:16';

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  aspectRatio: AspectRatio;
  badge?: string;
}

export interface BenefitItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  quote: string;
  rating: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface OfficialChannelItem {
  enabled: boolean;
  url: string;
  buttonText: string;
  description?: string;
}

export interface GoogleMeetChannelItem extends OfficialChannelItem {
  scheduleText?: string;
}

export interface OfficialChannels {
  enabled: boolean;
  badge?: string;
  title: string;
  subtitle: string;
  whatsappGroup: OfficialChannelItem;
  telegramGroup: OfficialChannelItem;
  googleMeet: GoogleMeetChannelItem;
}

export interface LandingPageContent {
  brand: {
    name: string;
    logoUrl?: string;
    primaryColor: string; // e.g. '#2563eb'
    accentColor: string; // e.g. '#10b981'
    darkTheme: boolean;
    fontFamily?: string; // e.g. 'Inter', 'Montserrat', 'Poppins', 'Oswald', etc.
    headingFontFamily?: string;
  };
  hero: {
    enabled: boolean;
    badge: string;
    title: string;
    titleHighlight: string;
    titleSize?: 'sm' | 'md' | 'lg' | 'xl';
    titleFontSizePx?: number;
    titleMaxWidth?: '3xl' | '4xl' | '5xl' | '6xl' | 'full';
    fontFamily?: string;
    subtitle: string;
    subtitleSize?: 'sm' | 'md' | 'lg';
    showConsultantCard: boolean;
    primaryCtaText: string;
    secondaryCtaText: string;
    mainVideo?: VideoItem;
  };
  videosSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    videos: VideoItem[];
  };
  benefitsSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    items: BenefitItem[];
  };
  consultantSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    consultantLabel: string;
    customDescription: string;
  };
  testimonialsSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    items: TestimonialItem[];
  };
  faqSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    items: FaqItem[];
  };
  tokenSection?: {
    enabled: boolean;
    badge?: string;
    title: string;
    subtitle: string;
    tokenSymbol: string;
    tokenName: string;
    network: string;
    contractAddress: string;
    copyButtonText: string;
    chartProvider?: 'geckoterminal' | 'dexscreener' | 'custom';
    embedUrl: string;
    coinMarketCapUrl: string;
    bscScanUrl?: string;
  };
  officialChannels?: OfficialChannels;
  chatSettings?: {
    enabled: boolean;
    title: string;
    subtitle: string;
    welcomeMessage: string;
    pinnedMessage?: string;
    slowModeSeconds?: number;
  };
  ctaBanner: {
    enabled: boolean;
    title: string;
    subtitle: string;
    ctaText: string;
    whatsappCtaText: string;
    urgencyBadge?: string;
  };
  footer: {
    companyName: string;
    cnpj?: string;
    legalText: string;
    privacyLink: string;
    termsLink: string;
  };
  defaultSettings: {
    registrationUrl: string;
    whatsappCountryCode: string;
    whatsappNumber: string;
    whatsappMessage: string;
  };
}

export interface LandingPageVersion {
  id: string;
  version_number: number;
  content_json: LandingPageContent;
  status: 'draft' | 'published';
  created_by?: string;
  created_at: string;
  published_at?: string;
}

export type EventType = 'page_view' | 'registration_click' | 'whatsapp_click';

export interface LandingEvent {
  id: string;
  user_id?: string | null;
  event_type: EventType;
  page_path: string;
  session_id?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface UserMetrics {
  total_views: number;
  registration_clicks: number;
  whatsapp_clicks: number;
  ctr: number;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalViews: number;
  totalRegistrationClicks: number;
  totalWhatsappClicks: number;
  globalCtr: number;
  topUsers: Array<{
    user: UserWithSettings;
    views: number;
    regClicks: number;
    waClicks: number;
    ctr: number;
  }>;
  recentUsers: UserProfile[];
  recentEvents: LandingEvent[];
}

// -------------------------------------------------------------
// Live Chat & Moderation System Types
// -------------------------------------------------------------

export type ChatMessageReadStatus = 'pending' | 'read';
export type ChatMessageType = 'public' | 'private' | 'system';
export type ChatUserRole = 'admin' | 'partner' | 'visitor';

export interface ChatMessage {
  id: string;
  sender_id: string; // User ID or Visitor ID (e.g. 'guest_abc123')
  sender_name: string;
  sender_role: ChatUserRole;
  content: string; // Pure text only
  type: ChatMessageType; // 'public' | 'private' | 'system'
  recipient_id?: string; // For private messages to admin or user
  recipient_name?: string;
  read_status?: ChatMessageReadStatus; // 'pending' | 'read'
  read_at?: string; // Timestamp when admin or recipient marked as read
  is_deleted?: boolean;
  is_pinned?: boolean;
  created_at: string;
}

export interface ChatSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  welcomeMessage: string;
  adminOnline: boolean;
  adminLastSeen?: string;
  manualOverride: 'auto' | 'online' | 'offline';
  slowModeSeconds: number;
  pinnedMessage?: string;
}

export interface UserChatRestriction {
  userId: string;
  userName: string;
  muted: boolean;
  mutedAt: string;
  mutedBy: string;
  reason?: string;
}

