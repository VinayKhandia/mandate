// src/routes.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { randomUUID } from 'node:crypto';
import { MandateInputSchema, EnforceProposalSchema } from './schemas.js';
import { insertMandate, getMandateById, insertAuditRecord, getAllAuditRecords } from './db.js';
import { evaluateMandatePolicy } from './mockPolicy.js';

export async function registerRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  
  /**
   * POST /api/mandates
   * Accepts a signed mandate from Intent Compiler (Vinay & Harshit).
   */
  fastify.post('/api/mandates', async (request, reply) => {
    const parseResult = MandateInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
    }

    const mandate = parseResult.data;
    
    // Check if mandate already exists
    const existing = getMandateById(mandate.id);
    if (existing) {
      return reply.status(409).send({ error: `Mandate with ID '${mandate.id}' already exists` });
    }

    insertMandate(mandate);

    return reply.status(201).send({
      message: 'Mandate successfully registered',
      mandate,
    });
  });

  /**
   * GET /api/mandates/:id
   * Fetch a registered mandate.
   */
  fastify.get<{ Params: { id: string } }>('/api/mandates/:id', async (request, reply) => {
    const mandate = getMandateById(request.params.id);
    if (!mandate) {
      return reply.status(404).send({ error: `Mandate '${request.params.id}' not found` });
    }
    return mandate;
  });

  /**
   * POST /api/enforce
   * Evaluates a payment proposal against the mandate and records the audit trail.
   */
  fastify.post('/api/enforce', async (request, reply) => {
    const parseResult = EnforceProposalSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
    }

    const proposal = parseResult.data;
    const mandate = getMandateById(proposal.mandateId);

    const now = new Date().toISOString();
    const auditId = randomUUID();

    if (!mandate) {
      // Log blocked audit record for unmapped mandate
      const auditEntry = insertAuditRecord({
        id: auditId,
        timestamp: now,
        mandateId: proposal.mandateId,
        orderId: proposal.orderId,
        merchantId: proposal.merchantId,
        amountCents: proposal.amountCents,
        currency: proposal.currency,
        status: 'BLOCKED',
        decisionReason: `Unknown mandate ID: ${proposal.mandateId}`,
      });

      return reply.status(403).send({
        allowed: false,
        reason: `Mandate '${proposal.mandateId}' does not exist`,
        auditRecord: auditEntry,
      });
    }

    // Evaluate deterministic policy
    const decision = evaluateMandatePolicy(mandate, proposal);
    const status = decision.allowed ? 'CAPTURED' : 'BLOCKED';

    // Insert tamper-evident audit record
    const auditEntry = insertAuditRecord({
      id: auditId,
      timestamp: now,
      mandateId: proposal.mandateId,
      orderId: proposal.orderId,
      merchantId: proposal.merchantId,
      amountCents: proposal.amountCents,
      currency: proposal.currency,
      status,
      decisionReason: decision.reason,
    });

    const statusCode = decision.allowed ? 200 : 403;
    return reply.status(statusCode).send({
      allowed: decision.allowed,
      decision,
      auditRecord: auditEntry,
    });
  });

  /**
   * GET /api/audit-logs
   * Returns all audit ledger entries (for Kaif's AG Grid frontend).
   */
  fastify.get('/api/audit-logs', async (_request, reply) => {
    const logs = getAllAuditRecords();
    return reply.send({
      count: logs.length,
      records: logs,
    });
  });
}
