import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, generateVerificationToken, hashToken, logDevVerificationEmail } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        {
          error: "EMAIL_ALREADY_VERIFIED",
          message: "Email address is already verified.",
        },
        { status: 400 }
      );
    }

    const rawToken = generateVerificationToken();
    const verificationTokenHash = hashToken(rawToken);
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationTokenHash,
        verificationTokenExpires,
      },
    });

    logDevVerificationEmail(user.email, rawToken);

    return NextResponse.json({
      message: "Verification email resent successfully.",
    });
  } catch (error) {
    console.error("Resend Verification Error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
