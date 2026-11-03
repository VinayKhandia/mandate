// src/db.ts
import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { Mandate, AuditRecord, PaymentStatus, Currency } from './types.js';

const dbPath = process.env.DATABASE_PATH || './mandate_audit.db';
export const db = new Database(dbPath);

// Enable WAL mode for fast writes and safe concurrent reads
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS mandates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    max_amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    allowed_merchants TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    public_key TEXT NOT NULL,
    signature TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_records (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    mandate_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    merchant_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    decision_reason TEXT NOT NULL,
    prev_hash TEXT NOT NULL,
    hash TEXT NOT NULL
  );
`);

/**
 * Compute SHA-256 hash for an audit record linked to the previous hash.
 */
export function calculateRecordHash(
  prevHash: string,
  id: string,
  timestamp: string,
  mandateId: string,
  orderId: string,
  merchantId: string,
  amountCents: number,
  currency: string,
  status: string,
  decisionReason: string
): string {
  const payload = `${prevHash}|${id}|${timestamp}|${mandateId}|${orderId}|${merchantId}|${amountCents}|${currency}|${status}|${decisionReason}`;
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Insert a new mandate into SQLite.
 */
export function insertMandate(mandate: Mandate): void {
  const stmt = db.prepare(`
    INSERT INTO mandates (id, user_id, max_amount_cents, currency, allowed_merchants, expires_at, public_key, signature, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    mandate.id,
    mandate.userId,
    mandate.maxAmountCents,
    mandate.currency,
    JSON.stringify(mandate.allowedMerchants),
    mandate.expiresAt,
    mandate.publicKey,
    mandate.signature,
    new Date().toISOString()
  );
}

/**
 * Fetch a mandate by ID.
 */
export function getMandateById(id: string): Mandate | null {
  const stmt = db.prepare('SELECT * FROM mandates WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    maxAmountCents: row.max_amount_cents,
    currency: row.currency as Currency,
    allowedMerchants: JSON.parse(row.allowed_merchants),
    expiresAt: row.expires_at,
    publicKey: row.public_key,
    signature: row.signature,
  };
}

/**
 * Insert an audit record with cryptographic hash chaining.
 */
export function insertAuditRecord(recordData: Omit<AuditRecord, 'prevHash' | 'hash'>): AuditRecord {
  // Get latest record to find prev_hash
  const lastStmt = db.prepare('SELECT hash FROM audit_records ORDER BY rowid DESC LIMIT 1');
  const lastRow = lastStmt.get() as { hash: string } | undefined;
  const prevHash = lastRow ? lastRow.hash : '0000000000000000000000000000000000000000000000000000000000000000';

  const hash = calculateRecordHash(
    prevHash,
    recordData.id,
    recordData.timestamp,
    recordData.mandateId,
    recordData.orderId,
    recordData.merchantId,
    recordData.amountCents,
    recordData.currency,
    recordData.status,
    recordData.decisionReason
  );

  const stmt = db.prepare(`
    INSERT INTO audit_records (id, timestamp, mandate_id, order_id, merchant_id, amount_cents, currency, status, decision_reason, prev_hash, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    recordData.id,
    recordData.timestamp,
    recordData.mandateId,
    recordData.orderId,
    recordData.merchantId,
    recordData.amountCents,
    recordData.currency,
    recordData.status,
    recordData.decisionReason,
    prevHash,
    hash
  );

  return {
    ...recordData,
    prevHash,
    hash,
  };
}

/**
 * Get all audit records ordered by timestamp (for Kaif's AG Grid).
 */
export function getAllAuditRecords(): AuditRecord[] {
  const stmt = db.prepare('SELECT * FROM audit_records ORDER BY timestamp DESC');
  const rows = stmt.all() as any[];

  return rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp,
    mandateId: r.mandate_id,
    orderId: r.order_id,
    merchantId: r.merchant_id,
    amountCents: r.amount_cents,
    currency: r.currency as Currency,
    status: r.status as PaymentStatus,
    decisionReason: r.decision_reason,
    prevHash: r.prev_hash,
    hash: r.hash,
  }));
}
