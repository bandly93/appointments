// src/lib/mailer.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const MAIL_FROM = process.env.MAIL_FROM ?? "onboarding@resend.dev";

function verificationEmailHtml(code: string): string {
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
                <h1 style="margin:0 0 8px;font-size:18px;color:#18181b;">Confirm your booking</h1>
                <p style="margin:0 0 24px;font-size:14px;color:#71717a;">Enter this code to verify your email and hold your appointment slot.</p>
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

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: "Your verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: verificationEmailHtml(code),
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
