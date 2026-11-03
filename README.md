# Mandate: Autonomous AI Agent Spending Firewall for PayPal

> A deterministic spending firewall and cryptographic intent audit ledger for agentic commerce.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v24.20.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)

---

## 1. Problem Statement
When an AI agent interacts with PayPal, the payment rails only verify that the API request originated from a valid user session or API token. PayPal cannot determine human intent (e.g., *"Spend at most $40 on a verified seller, arriving Friday"*). If an agent is tricked by prompt injection, compromised, or hallucinates, rogue transactions execute without verifiable intent boundaries to resolve disputes.

## 2. Solution: The Mandate Architecture
1. **Intent Compiler**: Human constraints are compiled into an Ed25519 cryptographically signed Mandate (price cap, allowed merchants, currency, expiry).
2. **Shopping Agent**: Prepares transactions on PayPal using `intent=AUTHORIZE` (placing funds on a temporary hold instead of immediate capture).
3. **Mandate Firewall API**: A deterministic policy engine written in strict code (not an LLM) validates the proposed payment against the signed mandate.
4. **Enforcement Service**: Holds capture credentials. If valid, it executes `CAPTURE`; if violated, it calls `VOID` immediately.
5. **Tamper-Evident Audit Ledger**: An append-only SQLite store with SHA-256 hash chaining powers an interactive AG Grid audit ledger.

---

## 3. Architecture Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Human User
    participant LLM as Intent Compiler (LLM)
    participant Agent as Shopping Agent
    participant Firewall as Mandate Firewall API
    participant PayPal as PayPal Sandbox
    participant DB as Audit Ledger (SQLite)

    User->>LLM: "Buy birthday gift under $40 from verified merchant"
    LLM->>User: Prompts confirmation
    LLM->>Firewall: Issue signed Mandate (Ed25519)
    Firewall->>DB: Record Mandate in audit ledger
    Agent->>PayPal: Create Order with intent=AUTHORIZE (Hold)
    PayPal-->>Agent: Returns Order ID (status: CREATED/APPROVED)
    Agent->>Firewall: Request capture authorization (Order ID + Mandate ID)
    Firewall->>Firewall: Verify Mandate signature & policy rules
    alt Policy Passed (Amount <= $40, Merchant Allowed)
        Firewall->>PayPal: Capture authorized payment
        Firewall->>DB: Log CAPTURED with intent receipt
        Firewall-->>Agent: Payment settled
    else Policy Violated (Prompt Injection / Price > $40)
        Firewall->>PayPal: Void authorization hold
        Firewall->>DB: Log BLOCKED & alert reason
        Firewall-->>Agent: 403 Forbidden - Mandate Violation
    end
```

---

## 4. Team Responsibilities
* **Policy Engine & Intent Compiler**: Vinay, Harshit (`src/mockPolicy.ts` -> Production Ed25519 engine)
* **REST API, Database & PayPal Integration**: Siri (Fastify routes, SQLite hash-chained audit ledger, PayPal Orders v2 enforcement)
* **Frontend Audit Dashboard**: Kaif (React + AG Grid Community)

---

## 5. Getting Started

### Prerequisites
* Node.js >= 20.x
* npm >= 10.x

### Setup
```bash
# Clone the repository
git clone https://github.com/VinayKhandia/mandate.git
cd mandate

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Run Server in Development Mode
```bash
npm run dev
```

### Type Checking & Testing
```bash
npx tsc --noEmit
npm test
```
