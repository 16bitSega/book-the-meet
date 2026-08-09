import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getCurrentUser, generateVerificationToken, hashToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let email: string | undefined;

    try {
      const body = await req.json();
      email = body?.email;
    } catch {
      // Body empty or omitted
    }

    let user;

    if (email) {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    } else {
      user = await getCurrentUser();
    }

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 400 });
    }

    // Generate new token
    const token = generateVerificationToken();
    const tokenHash = hashToken(token);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationTokenHash: tokenHash,
        verificationTokenExpires: tokenExpiry,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    // Use the updated sendEmail function
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      text: `Click here to verify: ${verifyUrl}`,
      html: `<a href="${verifyUrl}">Verify Email</a>`,
    });

    return NextResponse.json({ message: "Verification email sent (check logs if dev)" });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ message: "Failed to send email" }, { status: 500 });
  }
}
