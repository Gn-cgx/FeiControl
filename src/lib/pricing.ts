/**
 * OpenClaw Model Pricing
 * Based on Anthropic official pricing as of March 2026
 * All prices in USD per million tokens
 */

export interface ModelPricing {
  id: string;
  name: string;
  aliases: string[];
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  cacheReadPricePerMillion: number;
  cacheWritePricePerMillion: number;
  contextWindow: number;
}

export const MODEL_PRICING: ModelPricing[] = [
  // Anthropic Claude models (2026 pricing)
  {
    id: "claude-opus-4.6",
    name: "Claude Opus 4.6",
    aliases: ["opus", "anthropic/claude-opus-4-6", "claude-opus-4-6", "anthropic/claude-opus-4.6"],
    inputPricePerMillion: 5.00,
    outputPricePerMillion: 25.00,
    cacheReadPricePerMillion: 0.50,
    cacheWritePricePerMillion: 6.25,
    contextWindow: 200000,
  },
  {
    id: "claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    aliases: ["sonnet", "anthropic/claude-sonnet-4-6", "claude-sonnet-4-6", "anthropic/claude-sonnet-4.6", "claude-sonnet-4.5", "anthropic/claude-sonnet-4-5"],
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    cacheReadPricePerMillion: 0.30,
    cacheWritePricePerMillion: 3.75,
    contextWindow: 200000,
  },
  {
    id: "claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    aliases: ["haiku", "anthropic/claude-haiku-4-5", "claude-haiku-4-5", "anthropic/claude-haiku-3-5", "claude-haiku-3-5", "anthropic/claude-haiku-4.5"],
    inputPricePerMillion: 1.00,
    outputPricePerMillion: 5.00,
    cacheReadPricePerMillion: 0.10,
    cacheWritePricePerMillion: 1.25,
    contextWindow: 200000,
  },
  // Google Gemini
  {
    id: "gemini-2.5-flash",
    name: "Gemini Flash",
    aliases: ["gemini-flash", "google/gemini-2.5-flash"],
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
    cacheReadPricePerMillion: 0.02,
    cacheWritePricePerMillion: 0.15,
    contextWindow: 1000000,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini Pro",
    aliases: ["gemini-pro", "google/gemini-2.5-pro"],
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5.00,
    cacheReadPricePerMillion: 0.13,
    cacheWritePricePerMillion: 1.25,
    contextWindow: 2000000,
  },
];

/**
 * Find pricing for a model ID (handles exact match + aliases)
 */
function findPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING.find(
    (p) => p.id === modelId || p.aliases.includes(modelId)
  );
}

/**
 * Calculate cost for a given model and token usage (including cache tokens)
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number = 0,
  cacheWriteTokens: number = 0
): number {
  const pricing = findPricing(modelId);

  if (!pricing) {
    console.warn(`Unknown model: ${modelId}, using Sonnet pricing as default`);
    return (
      (inputTokens / 1_000_000) * 3.0 +
      (outputTokens / 1_000_000) * 15.0 +
      (cacheReadTokens / 1_000_000) * 0.30 +
      (cacheWriteTokens / 1_000_000) * 3.75
    );
  }

  return (
    (inputTokens / 1_000_000) * pricing.inputPricePerMillion +
    (outputTokens / 1_000_000) * pricing.outputPricePerMillion +
    (cacheReadTokens / 1_000_000) * pricing.cacheReadPricePerMillion +
    (cacheWriteTokens / 1_000_000) * pricing.cacheWritePricePerMillion
  );
}

/**
 * Get human-readable model name
 */
export function getModelName(modelId: string): string {
  return findPricing(modelId)?.name || modelId;
}

/**
 * Normalize model ID to canonical form
 */
export function normalizeModelId(modelId: string): string {
  const pricing = findPricing(modelId);
  return pricing?.id || modelId;
}
