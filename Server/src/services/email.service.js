import path from "path";
import { fileURLToPath } from "url";
import emailTransporter from "../config/email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(__dirname, "../../../client/public/brand/logo.png");

const sendEmail = async ({ to, subject, text, html, attachments }) => {
  const info = await emailTransporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
    attachments,
  });

  return info;
};

const sendVerificationEmail = async ({ email, name, token }) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const displayName = name || "there";

  const logoAttachment = {
    filename: "logo.png",
    path: logoPath,
    cid: "cocreate-logo",
    contentDisposition: "inline",
  };

  await sendEmail({
    to: email,
    subject: "Verify your COCREATE email",

    text: `
Hi ${displayName},

Welcome to COCREATE.

Please verify your email by opening this link:

${verificationUrl}

This verification link expires in 24 hours.

If you did not create a COCREATE account, you can ignore this email.
    `.trim(),

    html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your COCREATE email</title>
  </head>
  <body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f3f4f6; color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden;">
            <!-- Header / Logo -->
            <tr>
              <td align="center" style="padding:32px 24px 24px; background-color:#ffffff;">
                <a href="${process.env.CLIENT_URL}" style="text-decoration:none; display:inline-block;">
                  <img src="cid:cocreate-logo" alt="COCREATE" width="140" style="display:block; border:0;" />
                </a>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td align="center" style="padding:0 24px 32px;">
                <h1 style="margin:0 0 16px; font-size:24px; font-weight:700; color:#111827;">Verify your email</h1>
                <p style="margin:0 0 24px; font-size:16px; line-height:1.6; color:#4b5563;">
                  Hi ${displayName}, welcome to COCREATE.<br />
                  Please verify your email address to continue.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${verificationUrl}" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; font-weight:600; font-size:16px; padding:14px 32px; border-radius:8px; border:0;">
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:24px 0 0; font-size:14px; line-height:1.6; color:#6b7280;">
                  This verification link expires in 24 hours.<br />
                  If you did not create a COCREATE account, you can ignore this email.
                </p>

                <p style="margin:20px 0 0; font-size:14px; color:#9ca3af;">
                  Having trouble? Copy and paste this link into your browser:<br />
                  <a href="${verificationUrl}" style="color:#2563eb; word-break:break-all;">${verificationUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:24px; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} COCREATE. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
    attachments: [logoAttachment],
  });
};

export { sendEmail, sendVerificationEmail };
