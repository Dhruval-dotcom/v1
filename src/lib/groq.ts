import Groq from "groq-sdk";

const apiKeys = (process.env.GROQ_API_KEYS || "").split(",").filter(Boolean);
let currentKeyIndex = 0;

function rotateKey(): void {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
}

function getGroqClient(): Groq {
  if (apiKeys.length === 0) throw new Error("No GROQ API keys configured");
  return new Groq({ apiKey: apiKeys[currentKeyIndex] });
}

export async function generateWarningMessage(params: {
  studentName: string;
  warningTitle: string;
  severity: string;
  details: string;
  actionPlan: string;
  date: string;
}): Promise<string> {
  const { studentName, warningTitle, severity, details, actionPlan, date } =
    params;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You write SHORT, STRICT, HIGH-IMPACT warning messages for WhatsApp. Maximum 8-10 lines.

Rules:
- *bold* for emphasis, _italic_ for names/dates. No markdown, no hashtags, no bullet dashes.
- Be direct. No pleasantries. No "Dear" or "Hope you're well". Get to the point.
- Every word must hit hard. Cut filler ruthlessly.
- Severity sets the tone: green=firm reminder, yellow=serious note, orange=strong warning, red=final warning tone, black=zero tolerance/last chance.
- Structure: Name + Date → What happened → What must happen → Consequence (if orange+).
- Keep it under 150 words. Shorter is better. Impact over length.`,
    },
    {
      role: "user",
      content: `Generate a WhatsApp warning message with these details:
Student: ${studentName}
Warning Type: ${warningTitle}
Severity: ${severity}
Date: ${date}
Description: ${details}
Action Plan: ${actionPlan}`,
    },
  ];

  const maxAttempts = apiKeys.length;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        messages,
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        temperature: 0.7,
        max_completion_tokens: 1024,
      });
      rotateKey();
      return completion.choices[0]?.message?.content?.trim() || "";
    } catch {
      rotateKey();
      if (attempt === maxAttempts - 1)
        throw new Error("All GROQ API keys failed");
    }
  }
  throw new Error("All GROQ API keys failed");
}
