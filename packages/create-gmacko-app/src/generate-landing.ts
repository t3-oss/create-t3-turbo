/**
 * LLM-powered landing page generation.
 *
 * Supports Claude (Anthropic), Codex/GPT (OpenAI), and Gemini (Google).
 * Generates a complete Next.js page.tsx with tailored copy, features,
 * and design based on the user's product description.
 */

import * as p from "@clack/prompts";
import pc from "picocolors";

import type { LandingPageConfig } from "./types.js";

const SYSTEM_PROMPT = `You are a senior frontend developer and copywriter. Generate a complete Next.js App Router page.tsx file for a SaaS landing page.

Requirements:
- Use React Server Components (no "use client" directive on the page itself)
- Import { Button } from "@gmacko/ui/button" for CTA buttons
- Import Link from "next/link"
- Use Tailwind CSS v4 classes (no custom CSS)
- Support both light and dark mode using Tailwind dark: variants and CSS variables (text-foreground, bg-background, text-muted-foreground, bg-muted, border-border, text-primary, bg-primary)
- Include: navigation bar, hero section with headline + subheadline + CTA, features grid (6 features with inline SVG icons), social proof / stats section, pricing section with 3 tiers, final CTA section, footer
- Make the copy compelling, specific to the described product, and conversion-focused
- Use semantic HTML with proper heading hierarchy
- The page should be the default export

Return ONLY the complete TypeScript/JSX code for page.tsx with no markdown fences or explanation.`;

interface LlmResponse {
  content: string;
}

async function callClaude(prompt: string): Promise<LlmResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required for Claude",
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text content in Claude response");

  return { content: textBlock.text };
}

async function callOpenAI(prompt: string): Promise<LlmResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required for Codex/GPT",
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message.content;
  if (!content) throw new Error("No content in OpenAI response");

  return { content };
}

async function callGemini(prompt: string): Promise<LlmResponse> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_API_KEY environment variable is required for Gemini",
    );
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192 },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  const content = data.candidates[0]?.content.parts[0]?.text;
  if (!content) throw new Error("No content in Gemini response");

  return { content };
}

/**
 * Generate landing page content using the selected LLM provider.
 * Returns the generated page.tsx content, or null if generation fails.
 */
export async function generateLandingPage(
  config: LandingPageConfig,
  displayName: string,
): Promise<string | null> {
  if (!config.generate || config.provider === "none") {
    return null;
  }

  const spinner = p.spinner();
  const providerLabel =
    config.provider === "claude"
      ? "Claude"
      : config.provider === "codex"
        ? "GPT-4o"
        : "Gemini";

  spinner.start(`Generating landing page with ${providerLabel}...`);

  const fullPrompt = `Generate a landing page for "${displayName}". Here is the product description:\n\n${config.prompt}`;

  try {
    let result: LlmResponse;

    switch (config.provider) {
      case "claude":
        result = await callClaude(fullPrompt);
        break;
      case "codex":
        result = await callOpenAI(fullPrompt);
        break;
      case "gemini":
        result = await callGemini(fullPrompt);
        break;
      default:
        spinner.stop("Skipped landing page generation");
        return null;
    }

    // Strip markdown fences if the LLM wrapped the code
    let content = result.content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:tsx?|jsx?)?\n?/, "").replace(/\n?```$/, "");
    }

    spinner.stop(
      pc.green(`Landing page generated with ${providerLabel}`),
    );
    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    spinner.stop(pc.yellow(`Landing page generation failed: ${message}`));
    p.log.warn("Using default landing page template instead.");
    return null;
  }
}
