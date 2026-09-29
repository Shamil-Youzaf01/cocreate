import emailTransporter from "../config/email.js";

const sendEmail = async ({ to, subject, text, html }) => {
  const info = await emailTransporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return info;
};

const sendVerificationEmail = async ({ email, name, token }) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Verify your COCREATE email",

    text: `
Hi ${name},

Welcome to COCREATE.

Please verify your email by opening this link:

${verificationUrl}

This verification link expires in 24 hours.

If you did not create a COCREATE account, you can ignore this email.
    `.trim(),

    html: `
      <h2>Welcome to COCREATE</h2>

      <p>Hi ${name},</p>

      <p>
        Thanks for creating your COCREATE account.
        Please verify your email address to continue.
      </p>

      <p>
        <a href="${verificationUrl}">
          Verify Email
        </a>
      </p>

      <p>
        This verification link expires in 24 hours.
      </p>

      <p>
        If you did not create a COCREATE account,
        you can ignore this email.
      </p>
    `,
  });
};

export { sendEmail, sendVerificationEmail };
