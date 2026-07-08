import { APP_CONFIG } from "@/config/app-config";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/** Hosted logo for email clients (absolute URL required; local assets are blocked by many clients). */
export const EMAIL_LOGO_URL = "https://res.cloudinary.com/dnftsdhv2/image/upload/v1783484393/manta-logo_e08ti8.jpg";

/** Matches `src/styles/presets/manta.css` light theme + logo palette (#EF5F18, #28184A). */
export const brandColors = {
  primary: "#EF5F18",
  primaryLight: "#F57A3D",
  primaryDark: "#D95412",
  accentPurple: "#28184A",
  background: "#DFD9E6",
  foreground: "#28184A",
  text: "#3D3558",
  muted: "#7A738F",
  card: "#FFFFFF",
  border: "#E8E4EC",
  accent: "#F0ECF4",
} as const;

export const emailLayout = {
  maxWidth: 560,
  logoUrl: EMAIL_LOGO_URL,
  logoWidth: 220,
  logoHeight: 220,
  headerPadding: "28px 32px 24px",
} as const;

export const emailInline = {
  label: `padding:8px 0;font-weight:600;color:${brandColors.foreground};`,
  value: `padding:8px 0;color:${brandColors.text};`,
  valueStrong: `padding:8px 0;color:${brandColors.text};font-weight:600;`,
  h2: `color:${brandColors.foreground};`,
  h3: `margin:0 0 16px;color:${brandColors.foreground};font-size:18px;`,
  subheading: `margin:0 0 16px;color:${brandColors.foreground};font-size:16px;`,
  muted: `color:${brandColors.muted};`,
  panel: `background-color:${brandColors.accent};border:1px solid ${brandColors.border};border-radius:8px;padding:20px;margin:20px 0;`,
  successPanel: `background-color:rgba(239,95,24,0.08);border:1px solid rgba(239,95,24,0.22);border-radius:8px;padding:20px;margin:20px 0;`,
  warningPanel: `background-color:rgba(239,95,24,0.1);border-left:4px solid ${brandColors.primary};padding:12px 16px;margin:16px 0;`,
  warningText: `margin:0;color:${brandColors.foreground};font-size:14px;`,
  infoPanel: `background-color:${brandColors.accent};border-left:4px solid ${brandColors.accentPurple};padding:12px 16px;margin:16px 0;`,
  infoText: `margin:0;color:${brandColors.foreground};font-size:14px;`,
  destructivePanel: `background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:20px;margin:20px 0;`,
  destructiveHeading: `margin:0 0 16px;color:#991B1B;font-size:18px;`,
  notesDivider: `margin-top:16px;padding-top:16px;border-top:1px solid ${brandColors.border};`,
  notesText: `margin:0;color:${brandColors.muted};font-style:italic;`,
} as const;

export function getEmailLogoUrl() {
  return emailLayout.logoUrl;
}

export function getEmailAssetUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalizedPath}`;
}

export function emailHeaderHtml() {
  const logoUrl = getEmailLogoUrl();
  return `
        <div class="header">
          <img
            src="${logoUrl}"
            alt="${APP_CONFIG.name}"
            width="${emailLayout.logoWidth}"
            class="logo-image"
          />
        </div>`;
}

export function emailFooterHtml(note?: string) {
  return `
        <div class="footer">
          <p>${APP_CONFIG.copyright}</p>
          ${note ? `<p style="margin-top:6px;">${note}</p>` : ""}
        </div>`;
}

export const baseStyles = `
  <style>
    body {
      margin: 0;
      padding: 24px 16px;
      background-color: ${brandColors.background};
    }
    .email-container {
      max-width: ${emailLayout.maxWidth}px;
      margin: 0 auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: ${brandColors.background};
      color: ${brandColors.text};
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid ${brandColors.border};
    }
    .header {
      background: ${brandColors.accent};
      padding: ${emailLayout.headerPadding};
      text-align: center;
      border-bottom: 3px solid ${brandColors.primary};
    }
    .logo-image {
      display: block;
      margin: 0 auto;
      border: 0;
      outline: none;
      width: ${emailLayout.logoWidth}px;
      height: auto;
      max-width: 100%;
    }
    .content {
      padding: 32px 32px 28px;
      background: ${brandColors.card};
    }
    .content h2 {
      color: ${brandColors.foreground};
    }
    .button {
      display: inline-block;
      background: ${brandColors.primary};
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background: ${brandColors.primaryDark};
      color: #ffffff !important;
    }
    .footer {
      background-color: ${brandColors.accent};
      padding: 20px 32px;
      text-align: center;
      color: ${brandColors.muted};
      font-size: 13px;
      line-height: 20px;
    }
  </style>
`;
