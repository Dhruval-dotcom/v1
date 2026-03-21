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
      content: `You write SHORT, STRICT WhatsApp warning messages. 5-7 lines MAX. Under 100 words.

Format rules:
- Use *bold* for: student name, date, warning title, key action words, deadlines.
- Use _italic_ sparingly for emphasis.
- No markdown, no hashtags, no bullet points, no dashes, no numbered lists.
- No greetings. No "Dear", "Hi", "Hope you're well". Start directly.

Tone by severity:
- green = polite but firm reminder
- yellow = serious, clear expectations
- orange = strong warning with consequences
- red = final warning, urgent
- black = zero tolerance, last chance before action

Structure:
Line 1: *Student Name* | *Date* | *Warning Title*
Line 2-3: What happened (brief, factual)
Line 4-5: What must be done${actionPlan ? " (use the action plan provided)" : ""}
Line 6-7: Consequence (only for orange/red/black severity)

Keep it tight. Every word counts. Polish the language — professional but stern.`,
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
