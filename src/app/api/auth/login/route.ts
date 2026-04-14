import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const user = await queryOne("SELECT * FROM users WHERE email = ?", [email]) as { id: number; email: string; name: string; password_hash: string; avatar_color: string } | undefined;

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email, name: user.name });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, avatar_color: user.avatar_color },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}
