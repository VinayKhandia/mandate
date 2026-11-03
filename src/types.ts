// src/types.ts

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

export type PaymentStatus = 
  | 'PENDING_POLICY'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'BLOCKED'
  | 'VOIDED';

/**
 * The human constraint compiled and signed by the Intent Compiler (Vinay/Harshit's input).
 */
export interface Mandate {
  id: string;
  userId: string;
  maxAmountCents: number;       // e.g., 4000 = $40.00
  currency: Currency;
  allowedMerchants: string[];   // e.g., ["merchant_verified_1", "official_store"]
  expiresAt: string;            // ISO timestamp
  publicKey: string;            // Ed25519 public key of the signer
  signature: string;            // Hex or Base64 signature of the mandate payload
}

/**
 * The payment proposal coming from the shopping agent attempting to buy.
 */
export interface PaymentProposal {
  orderId: string;              // PayPal Order ID (intent=AUTHORIZE)
  mandateId: string;
  merchantId: string;
  amountCents: number;
  currency: Currency;
}

/**
 * Result returned by the Policy Engine.
 */
export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  ruleViolated?: 'MAX_AMOUNT_EXCEEDED' | 'MERCHANT_NOT_ALLOWED' | 'MANDATE_EXPIRED' | 'INVALID_SIGNATURE';
}

/**
 * Tamper-evident Audit Ledger Entry for Kaif's AG Grid frontend.
 */
export interface AuditRecord {
  id: string;
  timestamp: string;
  mandateId: string;
  orderId: string;
  merchantId: string;
  amountCents: number;
  currency: Currency;
  status: PaymentStatus;
  decisionReason: string;
  prevHash: string;
  hash: string;
}
