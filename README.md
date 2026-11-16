# TokenMeter

Local multi-provider LLM token and cost monitoring HUD for developers.

## Usage

```bash
# Preview cost for a model call
npx tokenmeter calc --model claude-3-5-sonnet --input 10000 --output 2000

# Record token usage locally
npx tokenmeter record --model gpt-4o --input 4500 --output 600

# View today's spend HUD and budget status
npx tokenmeter status

# Configure daily spending threshold
npx tokenmeter set-budget 10.00
```

## Features

- Zero runtime dependencies
- Local-first privacy: usage ledgers stay on your machine (`~/.tokenmeter/ledger.json`)
- Built-in token pricing for OpenAI, Anthropic, Gemini, Groq, and Ollama
- Spending velocity and customizable daily budget alerts

## License

MIT (c) Amit Gupta
