type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GenerateInput = {
  system: string;
  messages: AiChatMessage[];
  maxContextTokens: number;
  maxResponseTokens: number;
  temperature?: number;
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-5.4-nano";

const approximateTokens = (text: string) => Math.ceil((text || "").length / 4);

const trimMessagesToBudget = (messages: AiChatMessage[], budget: number) => {
  const kept: AiChatMessage[] = [];
  let used = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const cost = approximateTokens(message.content) + 8;
    if (used + cost > budget) {
      if (kept.length === 0) {
        kept.unshift({
          ...message,
          content: message.content.slice(Math.max(0, message.content.length - Math.max(400, budget * 4))),
        });
      }
      break;
    }
    kept.unshift(message);
    used += cost;
  }
  return kept;
};

export const summarizeOlderMessages = (messages: AiChatMessage[], maxContextTokens: number) => {
  const budget = Math.max(256, maxContextTokens - 512);
  const trimmed = trimMessagesToBudget(messages, budget);
  if (trimmed.length === messages.length) return trimmed;

  const removedCount = Math.max(messages.length - trimmed.length, 0);
  const removedText = messages.slice(0, removedCount).map((item) => item.content).join(" ");
  const summary = removedText.length > 800
    ? `${removedText.slice(0, 780)}...`
    : removedText;

  return [
    {
      role: "system" as const,
      content: `Conversation summary of earlier context: ${summary}`,
    },
    ...trimmed,
  ];
};

export const generateStructuredText = async ({
  system,
  messages,
  maxContextTokens,
  maxResponseTokens,
  temperature = 0.3,
}: GenerateInput) => {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const prepared = summarizeOlderMessages(messages, maxContextTokens);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature,
      max_completion_tokens: maxResponseTokens,
      messages: [
        { role: "system", content: system },
        ...prepared,
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "AI provider request failed.");
  }

  const text = String(payload?.choices?.[0]?.message?.content || "").trim();
  if (!text) {
    throw new Error("AI provider returned an empty response.");
  }

  return {
    provider: "openai",
    model: OPENAI_MODEL,
    text,
    raw: payload,
  };
};
