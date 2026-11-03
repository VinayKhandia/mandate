// src/schemas.ts
import { z } from 'zod';

export const MandateInputSchema = z.object({
  id: z.string().min(1, 'Mandate ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  maxAmountCents: z.number().int().positive('Max amount in cents must be positive integer'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']),
  allowedMerchants: z.array(z.string().min(1)).min(1, 'Must specify at least one allowed merchant'),
  expiresAt: z.string().datetime({ message: 'Must be valid ISO-8601 datetime' }),
  publicKey: z.string().min(1, 'Public key is required'),
  signature: z.string().min(1, 'Cryptographic signature is required'),
});

export const EnforceProposalSchema = z.object({
  orderId: z.string().min(1, 'PayPal Order ID is required'),
  mandateId: z.string().min(1, 'Mandate ID is required'),
  merchantId: z.string().min(1, 'Merchant ID is required'),
  amountCents: z.number().int().positive('Amount in cents must be positive integer'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']),
});
