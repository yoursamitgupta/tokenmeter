/**
 * Pricing rates per 1,000,000 tokens (USD).
 */

export const MODEL_PRICING = {
  // OpenAI
  'gpt-4o': { inputPerMillion: 2.50, outputPerMillion: 10.00, provider: 'OpenAI' },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.60, provider: 'OpenAI' },
  'o1': { inputPerMillion: 15.00, outputPerMillion: 60.00, provider: 'OpenAI' },
  'o3-mini': { inputPerMillion: 1.10, outputPerMillion: 4.40, provider: 'OpenAI' },

  // Anthropic
  'claude-3-5-sonnet': { inputPerMillion: 3.00, outputPerMillion: 15.00, provider: 'Anthropic' },
  'claude-3-5-haiku': { inputPerMillion: 0.80, outputPerMillion: 4.00, provider: 'Anthropic' },
  'claude-3-opus': { inputPerMillion: 15.00, outputPerMillion: 75.00, provider: 'Anthropic' },

  // Google
  'gemini-2.0-flash': { inputPerMillion: 0.10, outputPerMillion: 0.40, provider: 'Google' },
  'gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00, provider: 'Google' },
  'gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.30, provider: 'Google' },

  // Groq / DeepSeek
  'deepseek-chat': { inputPerMillion: 0.14, outputPerMillion: 0.28, provider: 'DeepSeek' },
  'llama-3.3-70b': { inputPerMillion: 0.59, outputPerMillion: 0.79, provider: 'Groq' },

  // Local / Self-Hosted
  'ollama': { inputPerMillion: 0.00, outputPerMillion: 0.00, provider: 'Local' }
};

export function calculateCost(modelName, inputTokens = 0, outputTokens = 0) {
  const normalized = (modelName || '').toLowerCase().trim();
  const pricing = MODEL_PRICING[normalized] || {
    inputPerMillion: 1.00,
    outputPerMillion: 3.00,
    provider: 'Generic'
  };

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  const totalCost = inputCost + outputCost;

  return {
    model: normalized,
    provider: pricing.provider,
    inputCost,
    outputCost,
    totalCost,
    formattedCost: `$${totalCost.toFixed(6)}`
  };
}
