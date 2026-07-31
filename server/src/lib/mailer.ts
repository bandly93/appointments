// src/lib/mailer.ts
import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const MAIL_FROM = process.env.MAIL_FROM ?? "onboarding@resend.dev";

function verificationEmailHtml(heading: string, body: string, buttonLabel: string, code: string, link: string): string {
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;padding:40px;">
            <tr>
              <td style="text-align:center;">
                <h1 style="margin:0 0 8px;font-size:18px;color:#18181b;">${heading}</h1>
                <p style="margin:0 0 24px;font-size:14px;color:#71717a;">${body}</p>
                <a href="${link}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;border-radius:6px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${buttonLabel}</a>
                <p style="margin:24px 0 8px;font-size:13px;color:#a1a1aa;">Or enter this code manually:</p>
                <div style="display:inline-block;padding:16px 32px;background-color:#f4f4f5;border-radius:6px;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b;">${code}</div>
                <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

export async function sendVerificationEmail(to: string, code: string, link: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: "Your verification code",
    text: `Confirm your booking: ${link}\n\nOr enter this code manually: ${code} (expires in 10 minutes)`,
    html: verificationEmailHtml(
      "Confirm your booking",
      "Tap below to confirm your email and hold your appointment slot.",
      "Confirm booking",
      code,
      link
    ),
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

function formatApptTime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

// Only ever built from fixed env vars, never user input.
function buildContactLine(): string {
  const parts: string[] = [];
  if (env.CLINIC_PHONE) parts.push(`call us at ${env.CLINIC_PHONE}`);
  if (env.CLINIC_EMAIL) parts.push(`email ${env.CLINIC_EMAIL}`);
  return parts.length ? `Questions? ${parts.join(" or ")}.` : "";
}

function confirmationEmailHtml(heading: string, lines: string[], buttonLabel: string, link: string, footer: string): string {
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;padding:40px;">
            <tr>
              <td style="text-align:center;">
                <h1 style="margin:0 0 12px;font-size:18px;color:#18181b;">${heading}</h1>
                ${lines.map((line) => `<p style="margin:0 0 4px;font-size:14px;color:#3f3f46;">${line}</p>`).join("")}
                <a href="${link}" style="display:inline-block;margin-top:20px;padding:12px 24px;background-color:#2563eb;border-radius:6px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${buttonLabel}</a>
                ${footer ? `<p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">${footer}</p>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

// Sent when staff approve a request — supersedes the earlier "confirm your
// email" link with a fresh one, since the booking is now a real, kept
// appointment the patient may refer back to at any point before it happens.
export async function sendBookingConfirmedEmail(
  to: string,
  details: { providerName: string; startsAt: Date; link: string }
): Promise<void> {
  const when = formatApptTime(details.startsAt);
  const contactLine = buildContactLine();

  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: "Your appointment is confirmed",
    text: [
      `Your appointment with ${details.providerName} is confirmed for ${when}.`,
      `View or manage your appointment: ${details.link}`,
      contactLine,
    ]
      .filter(Boolean)
      .join("\n\n"),
    html: confirmationEmailHtml(
      "Your appointment is confirmed",
      [`With ${details.providerName}`, when],
      "View my appointment",
      details.link,
      contactLine
    ),
  });

  if (error) {
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
}

export async function sendDocumentRequestEmail(to: string, code: string, link: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: "Confirm your document request",
    text: `Confirm your document request: ${link}\n\nOr enter this code manually: ${code} (expires in 10 minutes)`,
    html: verificationEmailHtml(
      "Confirm your document request",
      "Tap below to confirm your email and send your request to our team.",
      "Confirm request",
      code,
      link
    ),
  });

  if (error) {
    throw new Error(`Failed to send document request email: ${error.message}`);
  }
}
