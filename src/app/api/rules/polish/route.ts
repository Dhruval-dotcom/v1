import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { polishText } from "@/lib/groq";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const polished = await polishText(text);

    return Response.json({ polished });
  } catch {
    return Response.json({ error: "Failed to polish text" }, { status: 500 });
  }
}
