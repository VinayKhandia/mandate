// src/routes.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { randomUUID } from 'node:crypto';
import { MandateInputSchema, EnforceProposalSchema } from './schemas.js';
import { insertMandate, getMandateById, insertAuditRecord, getAllAuditRecords } from './db.js';
import { evaluateMandatePolicy } from './mockPolicy.js';
import { paypalService } from './paypal.js';

export async function registerRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  
  /**
   * POST /api/mandates
   * Accepts a signed mandate from Intent Compiler.
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
   * Evaluates proposal, executes PayPal CAPTURE (if allowed) or VOID (if blocked),
   * and records the cryptographic audit ledger entry.
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
      // Void hold on PayPal since mandate does not exist
      await paypalService.voidAuthorization(proposal.orderId);

      const auditEntry = insertAuditRecord({
        id: auditId,
        timestamp: now,
        mandateId: proposal.mandateId,
        orderId: proposal.orderId,
        merchantId: proposal.merchantId,
        amountCents: proposal.amountCents,
        currency: proposal.currency,
        status: 'VOIDED',
        decisionReason: `Unknown mandate ID: ${proposal.mandateId}`,
      });

      return reply.status(403).send({
        allowed: false,
        reason: `Mandate '${proposal.mandateId}' does not exist`,
        auditRecord: auditEntry,
      });
    }

    // Evaluate policy
    const decision = evaluateMandatePolicy(mandate, proposal);

    if (decision.allowed) {
      // POLICY PASSED: Capture PayPal hold
      const captureResult = await paypalService.captureOrder(proposal.orderId);
      
      const auditEntry = insertAuditRecord({
        id: auditId,
        timestamp: now,
        mandateId: proposal.mandateId,
        orderId: proposal.orderId,
        merchantId: proposal.merchantId,
        amountCents: proposal.amountCents,
        currency: proposal.currency,
        status: captureResult.success ? 'CAPTURED' : 'BLOCKED',
        decisionReason: captureResult.success 
          ? `Captured via PayPal (${captureResult.captureId || 'OK'})`
          : `PayPal capture failed: ${captureResult.status}`,
      });

      return reply.status(200).send({
        allowed: true,
        paypal: captureResult,
        decision,
        auditRecord: auditEntry,
      });
    } else {
      // POLICY VIOLATED: Void PayPal hold immediately
      const voidResult = await paypalService.voidAuthorization(proposal.orderId);

      const auditEntry = insertAuditRecord({
        id: auditId,
        timestamp: now,
        mandateId: proposal.mandateId,
        orderId: proposal.orderId,
        merchantId: proposal.merchantId,
        amountCents: proposal.amountCents,
        currency: proposal.currency,
        status: 'VOIDED',
        decisionReason: `${decision.reason} | PayPal hold voided`,
      });

      return reply.status(403).send({
        allowed: false,
        paypal: voidResult,
        decision,
        auditRecord: auditEntry,
      });
    }
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
