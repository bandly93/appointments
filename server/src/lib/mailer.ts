// src/lib/mailer.ts
import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const MAIL_FROM = process.env.MAIL_FROM ?? "onboarding@resend.dev";

// A transient Resend hiccup shouldn't be the reason a patient never hears
// back — one retry after a short delay before we give up and fall back to
// the fail-soft handling each caller already has.
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithRetry(
  send: () => Promise<{ error: { message: string } | null }>,
  attempts = 2,
  delayMs = 400
): Promise<{ error: { message: string } | null }> {
  let result = await send();
  for (let attempt = 1; result.error && attempt < attempts; attempt++) {
    await delay(delayMs);
    result = await send();
  }
  return result;
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

// `code` is optional: the booking flow proves email ownership with the link
// alone (see bookingRequests.service.ts), while document requests still pair
// the link with a manually-enterable code.
function verificationEmailHtml(heading: string, body: string, buttonLabel: string, link: string, code?: string): string {
  const contactLine = buildContactLine();
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
                ${code
                  ? `<p style="margin:24px 0 8px;font-size:13px;color:#a1a1aa;">Or enter this code manually:</p>
                <div style="display:inline-block;padding:16px 32px;background-color:#f4f4f5;border-radius:6px;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b;">${code}</div>
                <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`
                  : `<p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">This link expires in 10 minutes. If you didn't request an appointment, you can safely ignore this email.</p>`
                }
                ${contactLine ? `<p style="margin:20px 0 0;font-size:13px;color:#a1a1aa;">${contactLine}</p>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

export async function sendVerificationEmail(to: string, link: string): Promise<void> {
  const contactLine = buildContactLine();
  const { error } = await sendWithRetry(() =>
    resend.emails.send({
      from: MAIL_FROM,
      to,
      subject: "Confirm your appointment request",
      text: [
        `Confirm your request: ${link}`,
        "This link expires in 10 minutes. Once confirmed, we'll send your request to the office for review and follow up by email either way.",
        contactLine,
      ]
        .filter(Boolean)
        .join("\n\n"),
      html: verificationEmailHtml(
        "Confirm your request",
        "One quick step before this goes to the office: confirm this is your email address. Once confirmed, we'll review your request and follow up by email either way.",
        "Confirm request",
        link
      ),
    })
  );

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

function confirmationEmailHtml(
  heading: string,
  subhead: string,
  highlight: string,
  buttonLabel: string,
  link: string,
  footer: string
): string {
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
                <p style="margin:0 0 20px;font-size:14px;color:#71717a;">${subhead}</p>
                <div style="display:inline-block;padding:16px 28px;background-color:#f4f4f5;border-radius:6px;font-size:18px;font-weight:700;color:#18181b;">${highlight}</div>
                <div>
                  <a href="${link}" style="display:inline-block;margin-top:24px;padding:12px 24px;background-color:#2563eb;border-radius:6px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${buttonLabel}</a>
                </div>
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

// Sent the moment email verification succeeds — a durable, easy-to-find link
// distinct from the "confirm your request" email, since that one is about
// the verification action rather than "here's where to check on this later."
// Reuses the same (unrotated) token: the request's status hasn't changed
// what the link is allowed to do yet.
export async function sendRequestPendingEmail(
  to: string,
  details: { providerName: string; startsAt: Date; link: string }
): Promise<void> {
  const when = formatApptTime(details.startsAt);
  const contactLine = buildContactLine();

  const { error } = await sendWithRetry(() =>
    resend.emails.send({
      from: MAIL_FROM,
      to,
      subject: "Your appointment request is in review",
      text: [
        `Your request with ${details.providerName} for ${when} has been sent to the office for review.`,
        "We'll email you as soon as it's been approved or declined — no need to follow up in the meantime, though you're welcome to check its status any time using the link below.",
        `Check status: ${details.link}`,
        contactLine,
      ]
        .filter(Boolean)
        .join("\n\n"),
      html: confirmationEmailHtml(
        "Request received",
        `Requested with ${details.providerName}. We'll email you as soon as it's approved or declined — no need to follow up in the meantime.`,
        when,
        "Check status",
        details.link,
        contactLine
      ),
    })
  );

  if (error) {
    throw new Error(`Failed to send pending-request email: ${error.message}`);
  }
}

// Sent when staff approve a request — supersedes the earlier "confirm your
// request" link with a fresh one, since the booking is now a real, kept
// appointment the patient may refer back to at any point before it happens.
export async function sendBookingConfirmedEmail(
  to: string,
  details: { providerName: string; startsAt: Date; link: string }
): Promise<void> {
  const when = formatApptTime(details.startsAt);
  const contactLine = buildContactLine();

  const { error } = await sendWithRetry(() =>
    resend.emails.send({
      from: MAIL_FROM,
      to,
      subject: "Your appointment is confirmed",
      text: [
        `You're confirmed with ${details.providerName} for ${when}.`,
        "Please arrive a few minutes early. If your plans change, use the link below to view your appointment or let us know as soon as you can so we can offer the slot to someone else.",
        `View or manage your appointment: ${details.link}`,
        contactLine,
      ]
        .filter(Boolean)
        .join("\n\n"),
      html: confirmationEmailHtml(
        "You're confirmed",
        `With ${details.providerName}. Please arrive a few minutes early — if your plans change, let us know as soon as you can.`,
        when,
        "View or manage appointment",
        details.link,
        contactLine
      ),
    })
  );

  if (error) {
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
}

// Sent when staff decline a request — previously a silent status flip with
// no notification at all; a patient deserves to know either way, not just
// on approval. Reuses the same (unrotated) token/link as the pending-review
// email — rejecting doesn't rotate it — so the patient lands on their
// request's status page, which explains next steps and how to reach us.
export async function sendBookingRejectedEmail(
  to: string,
  details: { providerName: string; startsAt: Date; link: string }
): Promise<void> {
  const when = formatApptTime(details.startsAt);
  const contactLine = buildContactLine();

  const { error } = await sendWithRetry(() =>
    resend.emails.send({
      from: MAIL_FROM,
      to,
      subject: "Update on your appointment request",
      text: [
        `We're sorry — we weren't able to accommodate your request with ${details.providerName} for ${when}.`,
        "This is usually because the slot was no longer available by the time we reviewed it. Feel free to submit a new request for another time, or get in touch and we'll help find one.",
        `View details: ${details.link}`,
        contactLine,
      ]
        .filter(Boolean)
        .join("\n\n"),
      html: confirmationEmailHtml(
        "Request declined",
        `We weren't able to accommodate your request with ${details.providerName} — usually because the slot was no longer available. Feel free to submit a new request for another time, or get in touch and we'll help find one.`,
        when,
        "View details",
        details.link,
        contactLine
      ),
    })
  );

  if (error) {
    throw new Error(`Failed to send declined-request email: ${error.message}`);
  }
}

export async function sendDocumentRequestEmail(to: string, code: string, link: string): Promise<void> {
  const { error } = await sendWithRetry(() =>
    resend.emails.send({
      from: MAIL_FROM,
      to,
      subject: "Confirm your document request",
      text: `Confirm your document request: ${link}\n\nOr enter this code manually: ${code} (expires in 10 minutes)`,
      html: verificationEmailHtml(
        "Confirm your document request",
        "Tap below to confirm your email and send your request to our team.",
        "Confirm request",
        link,
        code
      ),
    })
  );

  if (error) {
    throw new Error(`Failed to send document request email: ${error.message}`);
  }
}
