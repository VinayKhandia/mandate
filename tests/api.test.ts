// tests/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from '../src/routes.js';
import { db, getAllAuditRecords } from '../src/db.js';

let app: FastifyInstance;

beforeAll(async () => {
  // Clear any existing test records
  db.exec('DELETE FROM audit_records; DELETE FROM mandates;');

  app = Fastify();
  await app.register(cors, { origin: true });
  await app.register(registerRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
  db.close();
});

describe('Mandate Firewall API & Hash-Chained Audit Ledger', () => {
  const sampleMandate = {
    id: 'mandate-birthday-gift-1',
    userId: 'user_alice_42',
    maxAmountCents: 4000, // $40.00
    currency: 'USD',
    allowedMerchants: ['official_store', 'amazon_verified'],
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // +24 hours
    publicKey: 'mock_pubkey_ed25519',
    signature: 'valid_mock_signature',
  };

  it('1. POST /api/mandates creates a valid mandate', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/mandates',
      payload: sampleMandate,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.mandate.id).toBe(sampleMandate.id);
  });

  it('2. POST /api/enforce ALLOWS payment within mandate limit ($35.00 <= $40.00)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/enforce',
      payload: {
        orderId: 'PAYPAL-ORD-101',
        mandateId: sampleMandate.id,
        merchantId: 'official_store',
        amountCents: 3500, // $35.00
        currency: 'USD',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.allowed).toBe(true);
    expect(body.auditRecord.status).toBe('CAPTURED');
  });

  it('3. POST /api/enforce BLOCKS prompt-injected payment exceeding cap ($400.00 > $40.00)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/enforce',
      payload: {
        orderId: 'PAYPAL-ORD-EXPLOIT',
        mandateId: sampleMandate.id,
        merchantId: 'official_store',
        amountCents: 40000, // $400.00 (injected exploit)
        currency: 'USD',
      },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.allowed).toBe(false);
    expect(body.decision.ruleViolated).toBe('MAX_AMOUNT_EXCEEDED');
    expect(body.auditRecord.status).toBe('BLOCKED');
  });

  it('4. POST /api/enforce BLOCKS unallowed merchant', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/enforce',
      payload: {
        orderId: 'PAYPAL-ORD-ROGUE',
        mandateId: sampleMandate.id,
        merchantId: 'unverified_phishing_vendor',
        amountCents: 2000,
        currency: 'USD',
      },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.allowed).toBe(false);
    expect(body.decision.ruleViolated).toBe('MERCHANT_NOT_ALLOWED');
  });

  it('5. GET /api/audit-logs returns tamper-evident hash-chained logs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/audit-logs',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.count).toBe(3); // 1 captured + 2 blocked
    
    // Verify hash chain consistency
    const records = getAllAuditRecords();
    expect(records.length).toBe(3);
    expect(records[0].prevHash).toBeDefined();
    expect(records[0].hash).toBeDefined();
  });
});
