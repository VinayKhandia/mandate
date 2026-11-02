# AI Tools Disclosure Log

In accordance with hackathon rules, all AI assistants and models utilized during the development of **Mandate** are recorded below with exact descriptions of their scope, usage, and human verification checkpoints.

| Tool / Model | Version / Provider | Purpose & Scope | Human Review & Verification |
| :--- | :--- | :--- | :--- |
| **Antigravity / Gemini 3.8 Flash** | Google DeepMind | Architecture planning, boilerplate generation, pair programming mentor | All payment logic, security signatures, and cryptographic hash-chaining verified by hand. |
| **Zod Schema Generator** | Open-source Library | Runtime request payload validation | Schema constraints (caps, currencies) verified against PayPal API specs. |

## Security & Verification Policy
* No API keys, credentials, or client secrets are ever provided to AI models.
* All financial arithmetic enforces integer minor-units or explicit decimal strings to avoid floating-point drift.
* Deterministic policy evaluations are executed in native TypeScript code, not delegated to LLM decision-making.
