import { APIConnectionTimeoutError, APIError, AzureOpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";
import { allowRequest, tooLarge } from "@/lib/rate-limit";
import {
  MAX_IMAGE_DATA_URL_CHARS,
  parseReport,
  validateAnalyzeRequest,
  type AnalyzeResponseBody,
} from "@/lib/skin-hair";

// A vision call usually takes 5 to 20 seconds. Platforms that read this (for example Vercel)
// use it as the function time limit.
export const maxDuration = 60;

const SYSTEM_PROMPT =
  `You are an expert AI cosmetic dermatologist and trichologist. Analyze the provided image of the user's skin or hair along with their provided text context. Output your response in strict JSON format matching exactly this structure: { "observations": "detailed visual markers like redness, texture, thinning", "current_situation": "what these signs indicate based on the text context", "suggestions": ["actionable lifestyle or over-the-counter care tip 1", "tip 2"], "disclaimer": "A prominent warning that this is an AI analysis, not a medical diagnosis, and they should consult a doctor." }.`;

/** GA Azure OpenAI API version that supports image input, JSON mode and max_tokens. */
const DEFAULT_API_VERSION = "2024-10-21";

// The JSON body is one data URL plus a short description.
const MAX_BODY_BYTES = MAX_IMAGE_DATA_URL_CHARS + 20_000;

const NO_STORE = { "Cache-Control": "no-store" } as const;

function reply(body: AnalyzeResponseBody, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function azureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const apiKey = process.env.AZURE_OPENAI_KEY?.trim();
  const deployment = process.env.AZURE_DEPLOYMENT_NAME?.trim();
  if (!endpoint || !apiKey || !deployment) return null;
  return {
    endpoint,
    apiKey,
    deployment,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION?.trim() || DEFAULT_API_VERSION,
  };
}

/** Reads the body but gives up as soon as it passes the limit, even when Content-Length is missing. */
async function readBody(req: NextRequest): Promise<string | "too_large" | null> {
  if (!req.body) return null;
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return "too_large";
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const config = azureConfig();
  if (!config) {
    console.error("analyze-patient: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY or AZURE_DEPLOYMENT_NAME is not set.");
    return reply({ error: "The analyzer is not available right now. Please try again later." }, 503);
  }

  if (tooLarge(req, MAX_BODY_BYTES)) {
    return reply({ error: "That photo is too large. Please try another one." }, 413);
  }
  // Every call here costs money, so keep one visitor from running up the bill. Best effort only:
  // add Cloudflare Rate Limiting or a WAF rule in front of this route for a hard limit.
  if (!allowRequest(req.headers, "analyze_patient", 8, 15 * 60 * 1000)) {
    return reply({ error: "You have run several analyses in a row. Please wait a few minutes and try again." }, 429);
  }

  const raw = await readBody(req);
  if (raw === "too_large") {
    return reply({ error: "That photo is too large. Please try another one." }, 413);
  }
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }
  const input = validateAnalyzeRequest(body);
  if (!input.ok) {
    return reply({ error: input.error }, 400);
  }

  try {
    const client = new AzureOpenAI({
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      deployment: config.deployment,
      apiVersion: config.apiVersion,
      timeout: 50_000,
      maxRetries: 1,
    });

    const completion = await client.chat.completions.create({
      model: config.deployment,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `User's description: ${input.description || "No description was provided."}`,
            },
            // "high" reads skin texture and hair detail better and costs a small, fixed number of
            // tokens at this image size.
            { type: "image_url", image_url: { url: input.image, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000,
    });

    const choice = completion.choices[0];
    if (!choice || choice.finish_reason === "content_filter" || choice.message.refusal) {
      return reply(
        { error: "The AI could not review this photo. Try a clearer, well-lit photo of the affected skin or hair." },
        422
      );
    }

    const report = parseReport(choice.message.content);
    if (!report) {
      return reply({ error: "We could not read the AI's answer. Please try again." }, 502);
    }
    return reply({ report });
  } catch (error) {
    // Never log the photo or the description: they are health information.
    const status = error instanceof APIError ? error.status : undefined;
    const code = error instanceof APIError ? error.code : undefined;
    console.error("analyze-patient: Azure OpenAI request failed", {
      name: error instanceof Error ? error.name : "unknown",
      status,
      code,
    });

    if (error instanceof APIConnectionTimeoutError) {
      return reply({ error: "The analysis took too long. Please try again." }, 504);
    }
    if (code === "content_filter") {
      return reply(
        { error: "The AI could not review this photo. Try a clearer, well-lit photo of the affected skin or hair." },
        422
      );
    }
    if (status === 429) {
      return reply({ error: "The analyzer is busy. Please try again in a minute." }, 429);
    }
    if (status === 401 || status === 403 || status === 404) {
      // Wrong key, endpoint or deployment name. A setup problem, not something the visitor can fix.
      return reply({ error: "The analyzer is not available right now. Please try again later." }, 503);
    }
    return reply({ error: "Something went wrong while analyzing. Please try again." }, 502);
  }
}
