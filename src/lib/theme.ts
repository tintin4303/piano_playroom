/**
 * Piano Playroom Standard Design Tokens & Theme Variables
 * Extracted directly from brand design mockups via pixel sampling.
 * All colors, radii, shadows, and typography are standardized here for team-wide use.
 */

export const theme = {
  colors: {
    // Primary Brand - Royal / Cobalt Blue
    primary: {
      DEFAULT: '#204CB4', // Main brand blue (Hero banners, "+ Schedule Lesson" CTA, active booked slots)
      hover: '#1B3F96',   // Hover state for primary buttons
      active: '#163378',  // Pressed state
      light: '#EBF1FF',   // Soft blue badge background (Date boxes, active calendar day headers)
      dark: '#142854',    // Deep navy heading text
      border: '#D4E2FD',  // Soft border for blue-tinted panels
    },

    // Brand Accent - Warm Golden Playroom Yellow
    yellow: {
      DEFAULT: '#F4D868', // Active navigation pills, secondary highlight buttons ("Check", "Schedule")
      hover: '#E8C850',   // Hover state
      light: '#FFF8DD',   // Needs-attention / alert card background
      border: '#F6E294',  // Alert card border
      text: '#8D6B00',    // Dark amber text for yellow backgrounds (accessible contrast)
    },

    // Status Green - Open / Available Slots
    green: {
      DEFAULT: '#0D8249', // Text & indicator dot for open slots
      light: '#E8F8F0',   // Background fill for open / available slots
      border: '#C7EED8',  // Border for open slot cards
    },

    // Status Red - Cancellations & Urgent Alerts
    red: {
      DEFAULT: '#D93838', // Cancelled slot text & error states
      light: '#FDECEC',   // Light red background fill
      border: '#F8C8C8',
    },

    // Neutrals & Surfaces
    surface: {
      canvas: '#F8F9FD',  // Main app background (clean, ultra-soft off-white canvas)
      card: '#FFFFFF',    // White card & panel background
      muted: '#F0F0F0',   // Inactive pill tabs ("Billing & payments", "Class History", "Student")
      border: '#EAECEF',  // Standard 1px divider and card stroke
    },

    // Typography
    text: {
      primary: '#182848', // High-contrast navy-slate for headings and titles
      body: '#334155',    // Standard body text
      muted: '#64748B',   // Subtitles, table headers, inactive labels
      subtle: '#94A3B8',  // Timestamps, helper notes, disabled text
      white: '#FFFFFF',
    },
  },

  radii: {
    pill: '9999px',      // Full rounded for navigation tabs, status chips, user avatars
    card: '16px',        // 16px (rounded-2xl) for primary dashboard cards and hero banners
    inner: '12px',       // 12px (rounded-xl) for nested items, date badges, input fields
    button: '10px',      // 10px (rounded-lg) for action buttons
  },

  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
} as const;

export type ThemeTokens = typeof theme;
export default theme;
