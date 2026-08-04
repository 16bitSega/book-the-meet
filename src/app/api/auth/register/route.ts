import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, generateVerificationToken, hashToken, logDevVerificationEmail } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  name: z.string().trim().min(1).max(50),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Validation error. Please check all fields.",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, name, password } = result.data;

    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError: any) {
      console.error("Database Registration Connection Error:", dbError);
      return NextResponse.json(
        {
          error: "DATABASE_UNAVAILABLE",
          message: "Database connection unavailable. Please ensure PostgreSQL is running (docker-compose up -d).",
        },
        { status: 503 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          error: "EMAIL_EXISTS",
          message: "A user account with this email address already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const rawVerificationToken = generateVerificationToken();
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        isEmailVerified: false,
        verificationTokenHash,
        verificationTokenExpires,
      },
    });

    // Log verification link in dev console
    logDevVerificationEmail(email, rawVerificationToken);

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during registration.",
      },
      { status: 500 }
    );
  }
}
