import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { calculateCost } from './pricing.js';

const DEFAULT_DIR = path.join(os.homedir(), '.tokenmeter');
const DEFAULT_LEDGER_PATH = path.join(DEFAULT_DIR, 'ledger.json');

export function getLedgerPath(customPath = null) {
  return customPath || DEFAULT_LEDGER_PATH;
}

export function loadLedger(customPath = null) {
  const filePath = getLedgerPath(customPath);
  if (!fs.existsSync(filePath)) {
    return { records: [], dailyBudgetUSD: 5.00 };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { records: [], dailyBudgetUSD: 5.00 };
  }
}

export function saveLedger(data, customPath = null) {
  const filePath = getLedgerPath(customPath);
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function recordUsage(entry, customPath = null) {
  const ledger = loadLedger(customPath);
  const cost = calculateCost(entry.model, entry.inputTokens || 0, entry.outputTokens || 0);

  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    model: entry.model,
    provider: cost.provider,
    inputTokens: entry.inputTokens || 0,
    outputTokens: entry.outputTokens || 0,
    totalTokens: (entry.inputTokens || 0) + (entry.outputTokens || 0),
    costUSD: cost.totalCost,
    tag: entry.tag || 'default'
  };

  ledger.records.push(record);
  saveLedger(ledger, customPath);

  return record;
}

export function computeSummary(customPath = null) {
  const ledger = loadLedger(customPath);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  let totalTokens = 0;
  let totalCostUSD = 0;
  let todayTokens = 0;
  let todayCostUSD = 0;

  const modelBreakdown = {};

  for (const r of ledger.records) {
    totalTokens += r.totalTokens;
    totalCostUSD += r.costUSD;

    const isToday = r.timestamp.startsWith(todayStr);
    if (isToday) {
      todayTokens += r.totalTokens;
      todayCostUSD += r.costUSD;
    }

    if (!modelBreakdown[r.model]) {
      modelBreakdown[r.model] = { tokens: 0, costUSD: 0, calls: 0 };
    }
    modelBreakdown[r.model].tokens += r.totalTokens;
    modelBreakdown[r.model].costUSD += r.costUSD;
    modelBreakdown[r.model].calls += 1;
  }

  const budget = ledger.dailyBudgetUSD || 5.00;
  const budgetExceeded = todayCostUSD >= budget;

  return {
    today: {
      tokens: todayTokens,
      costUSD: todayCostUSD,
      formattedCost: `$${todayCostUSD.toFixed(4)}`,
      budgetUSD: budget,
      budgetExceeded
    },
    lifetime: {
      tokens: totalTokens,
      costUSD: totalCostUSD,
      formattedCost: `$${totalCostUSD.toFixed(4)}`,
      totalCalls: ledger.records.length
    },
    modelBreakdown
  };
}
