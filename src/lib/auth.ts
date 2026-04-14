import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "splitmint-secret";

export interface AuthPayload {
  userId: number;
  email: string;
  name: string;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(req?: NextRequest): Promise<AuthPayload | null> {
  try {
    let token: string | undefined;
    if (req) {
      token = req.cookies.get("auth_token")?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get("auth_token")?.value;
    }
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
