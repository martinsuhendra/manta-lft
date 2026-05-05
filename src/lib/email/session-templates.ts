import { format } from "date-fns";

import { escapeHtml } from "../utils";

import { EmailTemplate, baseStyles } from "./base";

interface SessionInfo {
  itemName: string;
  date: string;
  startTime: string;
  endTime: string;
  teacher?: {
    name: string | null;
    email: string | null;
  } | null;
  notes?: string | null;
}

export function createSessionJoinedTemplate(session: SessionInfo, participantName: string): EmailTemplate {
  const sessionDate = format(new Date(session.date), "EEEE, MMMM d, yyyy");
  const escapedItemName = escapeHtml(session.itemName);
  const escapedParticipantName = escapeHtml(participantName);
  const teacherInfo = session.teacher ? escapeHtml(session.teacher.name || session.teacher.email || "TBA") : "TBA";
  const escapedNotes = session.notes ? escapeHtml(session.notes) : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>✅ You're Registered for a Class!</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>Great news! You've been successfully registered for the following class session:</p>
          
          <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 16px 0; color: #166534; font-size: 18px;">📅 Session Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 140px;">Class:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapedItemName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${sessionDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${session.startTime} - ${session.endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Teacher:</td>
                <td style="padding: 8px 0; color: #1f2937;">${teacherInfo}</td>
              </tr>
            </table>
            ${escapedNotes ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #d1d5db;"><p style="margin: 0; color: #4b5563; font-style: italic;">${escapedNotes}</p></div>` : ""}
          </div>
          
          <p style="margin-top: 24px;">We look forward to seeing you there! Please arrive a few minutes early.</p>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Reminder:</strong> If you need to cancel or make changes, please contact us as soon as possible.
            </p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ✅ YOU'RE REGISTERED FOR A CLASS! - Manta
    
    Hi ${escapedParticipantName},
    
    Great news! You've been successfully registered for the following class session:
    
    📅 SESSION DETAILS:
    Class: ${escapedItemName}
    Date: ${sessionDate}
    Time: ${session.startTime} - ${session.endTime}
    Teacher: ${teacherInfo}
    ${escapedNotes ? `Notes: ${escapedNotes}` : ""}
    
    We look forward to seeing you there! Please arrive a few minutes early.
    
    Reminder: If you need to cancel or make changes, please contact us as soon as possible.
    
    ---
    © 2025 Manta. All rights reserved.
    This is an automated email. Please do not reply to this message.
  `;

  return {
    subject: `✅ You're Registered: ${escapedItemName} on ${sessionDate} - Manta`,
    html,
    text,
  };
}

export function createSessionUpdatedTemplate(
  session: SessionInfo,
  participantName: string,
  changes: string[],
): EmailTemplate {
  const sessionDate = format(new Date(session.date), "EEEE, MMMM d, yyyy");
  const escapedItemName = escapeHtml(session.itemName);
  const escapedParticipantName = escapeHtml(participantName);
  const teacherInfo = session.teacher ? escapeHtml(session.teacher.name || session.teacher.email || "TBA") : "TBA";
  const escapedNotes = session.notes ? escapeHtml(session.notes) : null;
  const changesList = changes.map((change) => escapeHtml(change)).join("</li><li>");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>📝 Session Update</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>We wanted to inform you that there have been updates to a class session you're registered for:</p>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">⚠️ Changes Made:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #78350f;">
              <li>${changesList}</li>
            </ul>
          </div>
          
          <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 16px 0; color: #166534; font-size: 18px;">📅 Updated Session Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 140px;">Class:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapedItemName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${sessionDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${session.startTime} - ${session.endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Teacher:</td>
                <td style="padding: 8px 0; color: #1f2937;">${teacherInfo}</td>
              </tr>
            </table>
            ${escapedNotes ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #d1d5db;"><p style="margin: 0; color: #4b5563; font-style: italic;">${escapedNotes}</p></div>` : ""}
          </div>
          
          <p style="margin-top: 24px;">Please make note of these changes. We apologize for any inconvenience.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    📝 SESSION UPDATE - Manta
    
    Hi ${escapedParticipantName},
    
    We wanted to inform you that there have been updates to a class session you're registered for:
    
    ⚠️ CHANGES MADE:
    ${changes.map((change) => `- ${change}`).join("\n")}
    
    📅 UPDATED SESSION DETAILS:
    Class: ${escapedItemName}
    Date: ${sessionDate}
    Time: ${session.startTime} - ${session.endTime}
    Teacher: ${teacherInfo}
    ${escapedNotes ? `Notes: ${escapedNotes}` : ""}
    
    Please make note of these changes. We apologize for any inconvenience.
    
    ---
    © 2025 Manta. All rights reserved.
    This is an automated email. Please do not reply to this message.
  `;

  return {
    subject: `📝 Session Update: ${escapedItemName} on ${sessionDate} - Manta`,
    html,
    text,
  };
}

export function createSessionWaitlistedTemplate(session: SessionInfo, participantName: string): EmailTemplate {
  const sessionDate = format(new Date(session.date), "EEEE, MMMM d, yyyy");
  const escapedItemName = escapeHtml(session.itemName);
  const escapedParticipantName = escapeHtml(participantName);
  const teacherInfo = session.teacher ? escapeHtml(session.teacher.name || session.teacher.email || "TBA") : "TBA";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>⏳ You're on the Waitlist</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>Thank you for your interest! The class session you requested is currently at full capacity, so we've added you to the waitlist.</p>
          
          <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 16px 0; color: #92400e; font-size: 18px;">📅 Session Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 140px;">Class:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapedItemName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${sessionDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${session.startTime} - ${session.endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Teacher:</td>
                <td style="padding: 8px 0; color: #1f2937;">${teacherInfo}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 16px 0;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>What happens next?</strong> If a spot becomes available, you'll automatically be confirmed and receive an email notification. We'll notify you as soon as possible!
            </p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ⏳ YOU'RE ON THE WAITLIST - Manta
    
    Hi ${escapedParticipantName},
    
    Thank you for your interest! The class session you requested is currently at full capacity, so we've added you to the waitlist.
    
    📅 SESSION DETAILS:
    Class: ${escapedItemName}
    Date: ${sessionDate}
    Time: ${session.startTime} - ${session.endTime}
    Teacher: ${teacherInfo}
    
    What happens next? If a spot becomes available, you'll automatically be confirmed and receive an email notification. We'll notify you as soon as possible!
    
    ---
    © 2025 Manta. All rights reserved.
    This is an automated email. Please do not reply to this message.
  `;

  return {
    subject: `⏳ Waitlisted: ${escapedItemName} on ${sessionDate} - Manta`,
    html,
    text,
  };
}

export function createSessionCancelledTemplate(session: SessionInfo, participantName: string): EmailTemplate {
  const sessionDate = format(new Date(session.date), "EEEE, MMMM d, yyyy");
  const escapedItemName = escapeHtml(session.itemName);
  const escapedParticipantName = escapeHtml(participantName);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>❌ Session Cancelled</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>We're sorry to inform you that the following class session has been cancelled:</p>
          
          <div style="background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 16px 0; color: #991b1b; font-size: 18px;">📅 Cancelled Session</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 140px;">Class:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapedItemName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${sessionDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${session.startTime} - ${session.endTime}</td>
              </tr>
            </table>
          </div>
          
          <p style="margin-top: 24px;">We sincerely apologize for any inconvenience this may cause. If you have any questions or concerns, please don't hesitate to contact us.</p>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 16px 0;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>Next Steps:</strong> Your booking has been automatically cancelled. If you have any questions about alternative sessions or refunds, please contact our support team.
            </p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ❌ SESSION CANCELLED - Manta
    
    Hi ${escapedParticipantName},
    
    We're sorry to inform you that the following class session has been cancelled:
    
    📅 CANCELLED SESSION:
    Class: ${escapedItemName}
    Date: ${sessionDate}
    Time: ${session.startTime} - ${session.endTime}
    
    We sincerely apologize for any inconvenience this may cause. If you have any questions or concerns, please don't hesitate to contact us.
    
    Next Steps: Your booking has been automatically cancelled. If you have any questions about alternative sessions or refunds, please contact our support team.
    
    ---
    © 2025 Manta. All rights reserved.
    This is an automated email. Please do not reply to this message.
  `;

  return {
    subject: `❌ Session Cancelled: ${escapedItemName} on ${sessionDate} - Manta`,
    html,
    text,
  };
}

/** Member cancelled their own booking (session still runs). */
export function createMemberBookingCancellationConfirmationTemplate(
  session: SessionInfo,
  participantName: string,
): EmailTemplate {
  const sessionDate = format(new Date(session.date), "EEEE, MMMM d, yyyy");
  const escapedItemName = escapeHtml(session.itemName);
  const escapedParticipantName = escapeHtml(participantName);
  const teacherInfo = session.teacher ? escapeHtml(session.teacher.name || session.teacher.email || "TBA") : "TBA";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>Booking cancelled</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>This confirms you have cancelled your registration for the following class session:</p>
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 140px;">Class:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapedItemName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${sessionDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${session.startTime} - ${session.endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Teacher:</td>
                <td style="padding: 8px 0; color: #1f2937;">${teacherInfo}</td>
              </tr>
            </table>
          </div>
          <p style="margin-top: 16px; color: #4b5563; font-size: 14px;">If you change your mind, you can book again from the schedule while spots are available.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Booking cancelled - Manta

Hi ${participantName},

This confirms you have cancelled your registration for:

Class: ${session.itemName}
Date: ${sessionDate}
Time: ${session.startTime} - ${session.endTime}
Teacher: ${teacherInfo}

You can book again from the schedule while spots are available.

© 2025 Manta. All rights reserved.
This is an automated email. Please do not reply to this message.
  `.trim();

  return {
    subject: `Booking cancelled: ${escapedItemName} on ${sessionDate} - Manta`,
    html,
    text,
  };
}

/** Waitlisted member automatically confirmed when a spot opens (same session). */
export function createSessionPromotedFromWaitlistTemplate(
  session: SessionInfo,
  participantName: string,
): EmailTemplate {
  const sessionDate = format(new Date(session.date), "EEEE, MMMM d, yyyy");
  const escapedItemName = escapeHtml(session.itemName);
  const escapedParticipantName = escapeHtml(participantName);
  const teacherInfo = session.teacher ? escapeHtml(session.teacher.name || session.teacher.email || "TBA") : "TBA";
  const escapedNotes = session.notes ? escapeHtml(session.notes) : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>You're in — off the waitlist!</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>A spot opened up and you've been <strong>confirmed</strong> for this class (you're no longer on the waitlist):</p>
          <div style="background-color: #ecfdf5; border: 2px solid #34d399; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 18px;">📅 Session details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 140px;">Class:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapedItemName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${sessionDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${session.startTime} - ${session.endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Teacher:</td>
                <td style="padding: 8px 0; color: #1f2937;">${teacherInfo}</td>
              </tr>
            </table>
            ${escapedNotes ? `<div style="margin-top: 16px;"><p style="margin: 0; color: #4b5563; font-style: italic;">${escapedNotes}</p></div>` : ""}
          </div>
          <p style="margin-top: 20px;">We look forward to seeing you there.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
You're confirmed — off the waitlist! - Manta

Hi ${participantName},

A spot opened up and you've been confirmed for this class:

Class: ${session.itemName}
Date: ${sessionDate}
Time: ${session.startTime} - ${session.endTime}
Teacher: ${teacherInfo}
${session.notes ? `Notes: ${session.notes}` : ""}

We look forward to seeing you there.

© 2025 Manta. All rights reserved.
This is an automated email. Please do not reply to this message.
  `.trim();

  return {
    subject: `You're confirmed: ${escapedItemName} on ${sessionDate} (off waitlist) - Manta`,
    html,
    text,
  };
}
