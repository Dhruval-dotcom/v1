import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { generateWarningMessage } from "@/lib/groq";

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

    const { studentName, warningTitle, severity, details, actionPlan, date } =
      await request.json();

    if (!studentName || !warningTitle || !severity || !details || !date) {
      return Response.json(
        { error: "Student, warning type, severity, details, and date are required" },
        { status: 400 }
      );
    }

    const message = await generateWarningMessage({
      studentName,
      warningTitle,
      severity,
      details,
      actionPlan: actionPlan || "",
      date,
    });

    return Response.json({ message });
  } catch {
    return Response.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}
