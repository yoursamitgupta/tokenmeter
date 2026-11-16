import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { calculateCost, MODEL_PRICING } from '../src/pricing.js';
import { recordUsage, computeSummary } from '../src/ledger.js';

test('calculates accurate token pricing for OpenAI and Anthropic', () => {
  const gptCost = calculateCost('gpt-4o', 1_000_000, 1_000_000);
  assert.strictEqual(gptCost.inputCost, 2.50);
  assert.strictEqual(gptCost.outputCost, 10.00);
  assert.strictEqual(gptCost.totalCost, 12.50);

  const claudeCost = calculateCost('claude-3-5-sonnet', 500_000, 200_000);
  assert.strictEqual(claudeCost.inputCost, 1.50);
  assert.strictEqual(claudeCost.outputCost, 3.00);
  assert.strictEqual(claudeCost.totalCost, 4.50);

  const ollamaCost = calculateCost('ollama', 100_000, 100_000);
  assert.strictEqual(ollamaCost.totalCost, 0.00);
});

test('records usage in ledger and computes summary stats', () => {
  const tmpPath = path.join(os.tmpdir(), `test_ledger_${Date.now()}.json`);

  recordUsage({ model: 'gpt-4o-mini', inputTokens: 10_000, outputTokens: 2_000 }, tmpPath);
  recordUsage({ model: 'gemini-2.0-flash', inputTokens: 50_000, outputTokens: 10_000 }, tmpPath);

  const summary = computeSummary(tmpPath);
  assert.strictEqual(summary.today.tokens, 72_000);
  assert.ok(summary.today.costUSD > 0);
  assert.strictEqual(summary.lifetime.totalCalls, 2);
  assert.ok('gpt-4o-mini' in summary.modelBreakdown);
  assert.ok('gemini-2.0-flash' in summary.modelBreakdown);

  // Clean up
  if (fs.existsSync(tmpPath)) {
    fs.unlinkSync(tmpPath);
  }
});
