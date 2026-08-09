import nodemailer from "nodemailer";

interface SendEmailProps {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailProps) {
  const isDev = process.env.NODE_ENV !== "production" || !process.env.SMTP_HOST;

  if (isDev) {
    // DEV MODE: Log to console instead of sending
    console.log("\n\n=========================================");
    console.log("📧 DEVELOPMENT EMAIL INTERCEPTED");
    console.log("=========================================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("--- CONTENT ---");
    console.log(text);
    console.log("--- HTML ---");
    console.log(html);
    console.log("=========================================\n");

    // Simulate success delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true, messageId: "dev-message-id" };
  }

  // PROD MODE: Send real email if SMTP configured
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Book The Meet" <noreply@yourdomain.com>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}