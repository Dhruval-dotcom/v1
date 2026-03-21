import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
