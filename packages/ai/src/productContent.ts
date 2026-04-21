import { GoogleGenerativeAI } from "@google/generative-ai";

export type GeneratedProductContent = {
  description: string;
  urdu_description: string;
  tiktok_caption: string;
  whatsapp_text: string;
  meta_title: string;
  meta_desc: string;
};

function extractJson(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start >= 0 && end > start) return fenced.slice(start, end + 1);
  return fenced;
}

function sanitize(data: Record<string, unknown>): GeneratedProductContent {
  return {
    description: String(data.description ?? ""),
    urdu_description: String(data.urdu_description ?? ""),
    tiktok_caption: String(data.tiktok_caption ?? ""),
    whatsapp_text: String(data.whatsapp_text ?? ""),
    meta_title: String(data.meta_title ?? ""),
    meta_desc: String(data.meta_desc ?? ""),
  };
}

export async function generateProductContent(
  name: string,
  category: string,
  features: string[],
): Promise<GeneratedProductContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required");

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Pakistani ecommerce copywriter.
Product: ${name}, Category: ${category}, Features: ${features.join(", ")}
Return ONLY valid JSON (no markdown):
{description, urdu_description, tiktok_caption, whatsapp_text, meta_title, meta_desc}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Empty Gemini response");

  try {
    const parsed = JSON.parse(extractJson(text)) as Record<string, unknown>;
    return sanitize(parsed);
  } catch {
    throw new Error("Failed to parse Gemini JSON response");
  }
}
