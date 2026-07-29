import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawToken = searchParams.get("token");

    if (!rawToken) {
      return NextResponse.json(
        {
          error: "INVALID_OR_EXPIRED_TOKEN",
          message: "Verification token is required.",
        },
        { status: 400 }
      );
    }

    const verificationTokenHash = hashToken(rawToken);

    const user = await prisma.user.findUnique({
      where: { verificationTokenHash },
    });

    if (
      !user ||
      !user.verificationTokenExpires ||
      user.verificationTokenExpires < new Date()
    ) {
      return NextResponse.json(
        {
          error: "INVALID_OR_EXPIRED_TOKEN",
          message: "Verification token is invalid or has expired.",
        },
        { status: 400 }
      );
    }

    // Mark email as verified and clear verification fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationTokenHash: null,
        verificationTokenExpires: null,
      },
    });

    return NextResponse.json({
      message: "Email successfully verified.",
      isEmailVerified: true,
    });
  } catch (error) {
    console.error("Verify Email Error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
