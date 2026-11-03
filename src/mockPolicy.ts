// src/mockPolicy.ts
import { Mandate, PaymentProposal, PolicyDecision } from './types.js';

/**
 * Temporary mock of Vinay & Harshit's deterministic policy engine.
 * Validates constraints in plain code.
 */
export function evaluateMandatePolicy(mandate: Mandate, proposal: PaymentProposal): PolicyDecision {
  // Check Expiration
  const now = new Date();
  if (new Date(mandate.expiresAt) < now) {
    return {
      allowed: false,
      reason: `Mandate expired at ${mandate.expiresAt}`,
      ruleViolated: 'MANDATE_EXPIRED',
    };
  }

  // Check Currency
  if (mandate.currency !== proposal.currency) {
    return {
      allowed: false,
      reason: `Currency mismatch: expected ${mandate.currency}, received ${proposal.currency}`,
      ruleViolated: 'MAX_AMOUNT_EXCEEDED',
    };
  }

  // Check Amount Cap (in cents)
  if (proposal.amountCents > mandate.maxAmountCents) {
    return {
      allowed: false,
      reason: `Amount ${proposal.amountCents} exceeds cap of ${mandate.maxAmountCents} cents`,
      ruleViolated: 'MAX_AMOUNT_EXCEEDED',
    };
  }

  // Check Merchant Allowlist
  const isMerchantAllowed = mandate.allowedMerchants.some(
    m => m.toLowerCase() === proposal.merchantId.toLowerCase()
  );
  if (!isMerchantAllowed) {
    return {
      allowed: false,
      reason: `Merchant '${proposal.merchantId}' not in allowed list [${mandate.allowedMerchants.join(', ')}]`,
      ruleViolated: 'MERCHANT_NOT_ALLOWED',
    };
  }

  // Mock signature verification (will be replaced with real Ed25519 by Vinay/Harshit)
  if (!mandate.signature || mandate.signature === 'INVALID') {
    return {
      allowed: false,
      reason: 'Cryptographic signature is invalid or forged',
      ruleViolated: 'INVALID_SIGNATURE',
    };
  }

  return {
    allowed: true,
    reason: 'All mandate policy rules satisfied',
  };
}
