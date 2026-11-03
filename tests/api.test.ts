// tests/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from '../src/routes.js';
import { db, getAllAuditRecords } from '../src/db.js';
import { paypalService } from '../src/paypal.js';

let app: FastifyInstance;

beforeAll(async () => {
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

describe('Mandate Firewall API & PayPal Two-Phase Lifecycle', () => {
  const sampleMandate = {
    id: 'mandate-birthday-gift-1',
    userId: 'user_alice_42',
    maxAmountCents: 4000, // $40.00
    currency: 'USD',
    allowedMerchants: ['official_store', 'amazon_verified'],
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
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

  it('2. POST /api/enforce CAPTURES payment within mandate limit ($35.00 <= $40.00)', async () => {
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
    expect(body.paypal.success).toBe(true);
  });

  it('3. POST /api/enforce VOIDS prompt-injected payment exceeding cap ($400.00 > $40.00)', async () => {
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
    expect(body.auditRecord.status).toBe('VOIDED');
    expect(body.paypal.status).toBe('VOIDED');
  });

  it('4. POST /api/enforce VOIDS order for unallowed merchant', async () => {
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
    expect(body.auditRecord.status).toBe('VOIDED');
  });

  it('5. GET /api/audit-logs returns tamper-evident hash-chained logs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/audit-logs',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.count).toBe(3);
    
    const records = getAllAuditRecords();
    expect(records.length).toBe(3);
    expect(records[0].prevHash).toBeDefined();
    expect(records[0].hash).toBeDefined();
  });

  it('6. PayPalService token cache handles mock and live sandbox credentials cleanly', async () => {
    expect(paypalService.isMockMode()).toBe(true);
    const token = await paypalService.getAccessToken();
    expect(token).toBe('mock_sandbox_access_token');
  });

  it('7. Supports Indian Rupee (INR) mandates and payments in paise', async () => {
    const inrMandate = {
      id: 'mandate-inr-books-1',
      userId: 'user_bob_in',
      maxAmountCents: 250000, // ₹2,500.00 (in paise)
      currency: 'INR',
      allowedMerchants: ['flipkart_verified', 'amazon_in'],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      publicKey: 'mock_pubkey_ed25519',
      signature: 'valid_mock_signature',
    };

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/mandates',
      payload: inrMandate,
    });
    expect(createRes.statusCode).toBe(201);

    const enforceRes = await app.inject({
      method: 'POST',
      url: '/api/enforce',
      payload: {
        orderId: 'PAYPAL-ORD-INR-1',
        mandateId: inrMandate.id,
        merchantId: 'flipkart_verified',
        amountCents: 199900, // ₹1,999.00
        currency: 'INR',
      },
    });
    expect(enforceRes.statusCode).toBe(200);
    const body = JSON.parse(enforceRes.body);
    expect(body.allowed).toBe(true);
    expect(body.auditRecord.currency).toBe('INR');
    expect(body.auditRecord.status).toBe('CAPTURED');
  });
});
