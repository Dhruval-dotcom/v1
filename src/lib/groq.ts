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
    content: `You polish and format SHORT WhatsApp warning messages. DO NOT rewrite or change meaning. Only improve grammar, clarity, and formatting.

STRICT RULES:
- Keep original wording as much as possible
- Do NOT add new information
- Do NOT make it longer
- Keep under 100 words and 5–7 lines max

FORMATTING:
- Use *bold* for: student name, date, warning title, and key labels (Student, Date, Issue, Action)
- Use _italic_ only for action lines or emphasis
- No markdown symbols except * and _
- No bullet points, no dashes, no numbering
- No greetings or extra text

TONE:
- Professional, clear, slightly strict
- Adjust tone slightly based on severity but do NOT exaggerate

OUTPUT STRUCTURE:
Line 1: ⚠️ *Warning: [Title]*
Line 2: *Student:* [Name]
Line 3: *Date:* [Date]
Line 4: *Issue:* [Polished short sentence]
Line 5-6: *Action:* [Use given action plan, lightly polished]

Keep it concise. Keep it close to input. Only refine, not rewrite.`,
  },
  {
    role: "user",
    content: `Student: ${studentName}
Warning: ${warningTitle}
Severity: ${severity}
Date: ${date}
Issue: ${details}${actionPlan ? `\nAction Plan: ${actionPlan}` : ""}`,
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
