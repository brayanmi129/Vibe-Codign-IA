/**
 * Cliente Groq — wrapper sobre la API de chat completions (compatible OpenAI).
 * Soporta texto y visión. Sin SDK: fetch directo.
 *
 * Free tier (sin tarjeta): 30 RPM, 14.400 RPD por modelo.
 * Docs: https://console.groq.com/docs/api-reference
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Modelos por defecto. Si Groq deprecara alguno, basta con cambiar la constante.
export const GROQ_MODEL_TEXT = "llama-3.3-70b-versatile";
export const GROQ_MODEL_VISION = "meta-llama/llama-4-scout-17b-16e-instruct";

export const isGroqConfigured = (): boolean => Boolean(GROQ_API_KEY);

// ── Tipos ──────────────────────────────────────────────────────────

export interface GroqTextMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Mensaje multimodal (visión): content es un array de bloques.
export interface GroqVisionMessage {
  role: 'user';
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  >;
}

interface GroqRequestOptions {
  messages: (GroqTextMessage | GroqVisionMessage)[];
  model?: string;
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
}

// ── Llamada base ───────────────────────────────────────────────────

async function groqCall(opts: GroqRequestOptions): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY no configurada");
  }

  const body: Record<string, unknown> = {
    model: opts.model || GROQ_MODEL_TEXT,
    messages: opts.messages,
    max_tokens: opts.maxTokens ?? 600,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Groq error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── API pública: texto ─────────────────────────────────────────────

export interface GenerateTextOptions {
  systemPrompt?: string;
  userPrompt: string;
  history?: GroqTextMessage[]; // mensajes previos del chat (sin system)
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export async function groqGenerateText(opts: GenerateTextOptions): Promise<string> {
  const messages: GroqTextMessage[] = [];
  if (opts.systemPrompt) {
    messages.push({ role: 'system', content: opts.systemPrompt });
  }
  if (opts.history?.length) {
    messages.push(...opts.history);
  }
  messages.push({ role: 'user', content: opts.userPrompt });

  return groqCall({
    messages,
    jsonMode: opts.jsonMode,
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
  });
}

// ── API pública: visión (analizar imagen) ──────────────────────────

export interface GenerateVisionOptions {
  prompt: string;
  imageBase64: string;        // base64 sin el prefijo data:
  mimeType?: string;          // default 'image/jpeg'
  jsonMode?: boolean;
  maxTokens?: number;
}

export async function groqGenerateVision(opts: GenerateVisionOptions): Promise<string> {
  const mime = opts.mimeType || 'image/jpeg';
  // Llama Scout acepta imágenes como data URL (igual que OpenAI Vision).
  const dataUrl = `data:${mime};base64,${opts.imageBase64}`;

  const messages: GroqVisionMessage[] = [{
    role: 'user',
    content: [
      { type: 'text', text: opts.prompt },
      { type: 'image_url', image_url: { url: dataUrl } },
    ],
  }];

  return groqCall({
    messages,
    model: GROQ_MODEL_VISION,
    jsonMode: opts.jsonMode,
    maxTokens: opts.maxTokens ?? 800,
    temperature: 0.4, // visión: más determinista
  });
}
