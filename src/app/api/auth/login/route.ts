import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { comparePassword, setAuthCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Please enter a valid email address and password.",
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError: any) {
      console.error("Database Login Connection Error:", dbError);
      return NextResponse.json(
        {
          error: "DATABASE_UNAVAILABLE",
          message: "Database connection unavailable. Please ensure PostgreSQL is running (docker-compose up -d).",
        },
        { status: 503 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password. Please check your credentials or create a new account.",
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password. Please check your credentials or create a new account.",
        },
        { status: 401 }
      );
    }

    // Issue JWT cookie with current tokenVersion
    await setAuthCookie({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Login Route Error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during login.",
      },
      { status: 500 }
    );
  }
}
