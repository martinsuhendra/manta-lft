// Re-export all email templates from separate files
export type { EmailTemplate, brandColors, baseStyles } from "./base";

// Auth-related templates
export {
  createEmailVerificationTemplate,
  createPasswordResetTemplate,
  createSignupWelcomeTemplate,
  createWelcomeTemplate,
} from "./auth-templates";

// Payment-related templates
export {
  createPaymentSuccessPasswordResetTemplate,
  createPaymentSuccessTemplate,
  type PaymentSuccessTemplateParams,
} from "./payment-templates";

// General templates
export { createContactFormTemplate, createUserLinkTemplate } from "./general-templates";

// Session templates
export {
  createMemberBookingCancellationConfirmationTemplate,
  createSessionJoinedTemplate,
  createSessionPromotedFromWaitlistTemplate,
  createSessionUpdatedTemplate,
  createSessionCancelledTemplate,
  createSessionWaitlistedTemplate,
} from "./session-templates";

// Legacy template that might still be in use - simplified version
export function createMultipleActiveMembershipsTemplate(
  customerName?: string,
  activeMembershipsCount: number = 2,
  supportEmail: string = "info@forcerasolution.com",
) {
  return {
    subject: "⚠️ Important Notice: Multiple Active Memberships - Manta",
    html: `<p>Multiple membership notice for ${customerName ?? "customer"} (${activeMembershipsCount} active). Contact: ${supportEmail}</p>`,
    text: `Multiple membership notice for ${customerName ?? "customer"} (${activeMembershipsCount} active). Contact: ${supportEmail}`,
  };
}
