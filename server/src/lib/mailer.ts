// src/lib/mailer.ts
// Dev stub: no email provider is wired up yet, so "sending" just logs the
// code server-side. Swap the body of this function for a real provider
// (Resend/SendGrid/SMTP/etc.) later — call sites don't need to change.
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  console.log(`[mailer] Verification code for ${to}: ${code}`);
}
