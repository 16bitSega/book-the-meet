import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();

    if (currentUser) {
      // Increment tokenVersion to revoke all active JWT tokens for this user account
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { tokenVersion: { increment: 1 } },
      });
    }

    await clearAuthCookie();

    return NextResponse.json({ message: "Successfully logged out." });
  } catch (error) {
    console.error("Logout Error:", error);
    await clearAuthCookie();
    return NextResponse.json({ message: "Logged out." });
  }
}
