# Mandate: Teammate Integration Guide

This guide describes how to connect with Siri's backend API, SQLite audit database, and PayPal enforcement service.

---

## 1. For Vinay & Harshit (Intent Compiler & Policy Engine)

### Mandate Registration (`POST /api/mandates`)
Once your LLM compiler produces the user's signed mandate, send it to:

* **Endpoint**: `POST http://localhost:3000/api/mandates`
* **Content-Type**: `application/json`
* **Payload**:
```json
{
  "id": "mandate-uuid-string",
  "userId": "user_id_string",
  "maxAmountCents": 4000,
  "currency": "USD",
  "allowedMerchants": ["official_merchant_1", "official_merchant_2"],
  "expiresAt": "2026-11-04T12:00:00.000Z",
  "publicKey": "ed25519_public_key_hex",
  "signature": "ed25519_signature_hex"
}
```
* **Success Response (201 Created)**:
```json
{
  "message": "Mandate successfully registered",
  "mandate": { ... }
}
```

### Policy Engine Hand-Off
Your policy evaluation rules are currently stubbed in `src/mockPolicy.ts`.
To plug in your cryptographic Ed25519 signature checks:
1. Edit `evaluateMandatePolicy()` in `src/mockPolicy.ts`.
2. Add your native `node:crypto.verify()` call.
3. All unit tests (`npm test`) and demo scripts (`npm run demo`) will automatically use your updated verification logic.

---

## 2. For Shopping Agent Developers

### Payment Enforcement Request (`POST /api/enforce`)
Before or after calling PayPal Orders v2 with `intent=AUTHORIZE`:

* **Endpoint**: `POST http://localhost:3000/api/enforce`
* **Content-Type**: `application/json`
* **Payload**:
```json
{
  "orderId": "PAYPAL-ORDER-ID",
  "mandateId": "mandate-uuid-string",
  "merchantId": "merchant_name",
  "amountCents": 3499,
  "currency": "USD"
}
```
* **Allowed Response (200 OK)**:
```json
{
  "allowed": true,
  "paypal": { "success": true, "captureId": "...", "status": "COMPLETED" },
  "decision": { "allowed": true, "reason": "All mandate policy rules satisfied" },
  "auditRecord": { ... }
}
```
* **Blocked / Injected Response (403 Forbidden)**:
```json
{
  "allowed": false,
  "paypal": { "success": true, "status": "VOIDED" },
  "decision": {
    "allowed": false,
    "reason": "Amount 40000 exceeds cap of 4000 cents",
    "ruleViolated": "MAX_AMOUNT_EXCEEDED"
  },
  "auditRecord": { ... }
}
```

---

## 3. For Kaif (React Frontend & AG Grid Audit Ledger)

### Audit Logs Feed (`GET /api/audit-logs`)
CORS is enabled for all origins (`@fastify/cors`).

* **Endpoint**: `GET http://localhost:3000/api/audit-logs`
* **Response**:
```json
{
  "count": 2,
  "records": [
    {
      "id": "e4b1c8a...",
      "timestamp": "2026-11-03T09:53:00.000Z",
      "mandateId": "mandate-bday-alice-2026",
      "orderId": "PAYPAL-ORD-LEGIT-8841",
      "merchantId": "official_tech_outlet",
      "amountCents": 3499,
      "currency": "USD",
      "status": "CAPTURED",
      "decisionReason": "All mandate policy rules satisfied",
      "prevHash": "0000000000000000000000000000000000000000000000000000000000000000",
      "hash": "1ae8871e3d661007..."
    }
  ]
}
```

### AG Grid Column Definitions
```typescript
const columnDefs = [
  { field: 'timestamp', headerName: 'Timestamp', sort: 'desc' },
  { field: 'orderId', headerName: 'PayPal Order ID' },
  { field: 'merchantId', headerName: 'Merchant' },
  { 
    field: 'amountCents', 
    headerName: 'Amount', 
    valueFormatter: p => `$${(p.value / 100).toFixed(2)}` 
  },
  { 
    field: 'status', 
    headerName: 'Status',
    cellClassRules: {
      'status-captured': p => p.value === 'CAPTURED',
      'status-voided': p => p.value === 'VOIDED' || p.value === 'BLOCKED'
    }
  },
  { field: 'decisionReason', headerName: 'Decision / Policy Reason' },
  { field: 'hash', headerName: 'Audit Hash (SHA-256)' }
];
```
