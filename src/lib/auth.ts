import { SignJWT, jwtVerify } from "jose";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-change-me"
);

export type TokenPayload = {
  id: string;
  role: "super_admin" | "admin";
  batchId?: string;
};

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(
  cookieStore: ReadonlyRequestCookies
): Promise<TokenPayload | null> {
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
