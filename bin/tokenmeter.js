#!/usr/bin/env node

import { computeSummary, recordUsage, loadLedger, saveLedger } from '../src/ledger.js';
import { calculateCost } from '../src/pricing.js';

const args = process.argv.slice(2);
const command = args[0] || 'status';

function showHelp() {
  console.log(`
TokenMeter - Local Multi-Provider LLM Token & Cost HUD

Usage:
  npx tokenmeter [command] [options]

Commands:
  status                     Display token consumption and budget status [default]
  record --model <name>      Record a completion event
         --input <count>
         --output <count>
  set-budget <amount>        Set daily budget threshold in USD
  calc --model <name>        Preview estimated cost for token counts
       --input <count>
       --output <count>
  reset                      Clear local usage records
  -h, --help                 Show help message

Examples:
  npx tokenmeter status
  npx tokenmeter record --model claude-3-5-sonnet --input 4500 --output 650
  npx tokenmeter set-budget 10.00
`);
}

if (args.includes('-h') || args.includes('--help')) {
  showHelp();
  process.exit(0);
}

if (command === 'status') {
  const summary = computeSummary();
  console.log('\n📊 TokenMeter - Daily AI Spend HUD');
  console.log('========================================');
  console.log(` Today's Spend:   ${summary.today.formattedCost} / $${summary.today.budgetUSD.toFixed(2)} budget`);
  console.log(` Today's Tokens:  ${summary.today.tokens.toLocaleString()}`);

  const pct = Math.min(100, Math.round((summary.today.costUSD / summary.today.budgetUSD) * 100));
  const barFilled = Math.round(pct / 5);
  const bar = '█'.repeat(barFilled) + '░'.repeat(Math.max(0, 20 - barFilled));
  console.log(` Budget Used:     [${bar}] ${pct}%`);

  if (summary.today.budgetExceeded) {
    console.log('\n ⚠️  ALERT: Daily spending budget exceeded!');
  }

  console.log('\n--- Model Breakdown ---');
  for (const [model, stats] of Object.entries(summary.modelBreakdown)) {
    console.log(` • ${model.padEnd(20)} ${stats.calls} calls | ${stats.tokens.toLocaleString()} tokens | $${stats.costUSD.toFixed(4)}`);
  }

  console.log('\n Lifetime Spend:  ' + summary.lifetime.formattedCost + ' (' + summary.lifetime.tokens.toLocaleString() + ' tokens)');
  process.exit(0);
}

if (command === 'record') {
  const modelIdx = args.indexOf('--model');
  const inputIdx = args.indexOf('--input');
  const outputIdx = args.indexOf('--output');

  const model = modelIdx !== -1 ? args[modelIdx + 1] : 'gpt-4o-mini';
  const inputTokens = inputIdx !== -1 ? parseInt(args[inputIdx + 1], 10) : 0;
  const outputTokens = outputIdx !== -1 ? parseInt(args[outputIdx + 1], 10) : 0;

  const res = recordUsage({ model, inputTokens, outputTokens });
  console.log(`Recorded: ${res.model} | ${res.totalTokens} tokens | $${res.costUSD.toFixed(6)}`);
  process.exit(0);
}

if (command === 'calc') {
  const modelIdx = args.indexOf('--model');
  const inputIdx = args.indexOf('--input');
  const outputIdx = args.indexOf('--output');

  const model = modelIdx !== -1 ? args[modelIdx + 1] : 'gpt-4o';
  const inputTokens = inputIdx !== -1 ? parseInt(args[inputIdx + 1], 10) : 1000;
  const outputTokens = outputIdx !== -1 ? parseInt(args[outputIdx + 1], 10) : 500;

  const cost = calculateCost(model, inputTokens, outputTokens);
  console.log(`Cost Estimate: ${cost.provider} ${cost.model}`);
  console.log(`Input:  ${inputTokens.toLocaleString()} tokens ($${cost.inputCost.toFixed(6)})`);
  console.log(`Output: ${outputTokens.toLocaleString()} tokens ($${cost.outputCost.toFixed(6)})`);
  console.log(`Total:  ${cost.formattedCost}`);
  process.exit(0);
}

if (command === 'set-budget') {
  const amount = parseFloat(args[1]);
  if (isNaN(amount) || amount <= 0) {
    console.error('Error: Please provide a valid positive budget amount');
    process.exit(1);
  }
  const ledger = loadLedger();
  ledger.dailyBudgetUSD = amount;
  saveLedger(ledger);
  console.log(`Daily budget updated to $${amount.toFixed(2)}`);
  process.exit(0);
}

if (command === 'reset') {
  saveLedger({ records: [], dailyBudgetUSD: 5.00 });
  console.log('Local token ledger reset successfully.');
  process.exit(0);
}

showHelp();
