import React from 'react';
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, X } from 'lucide-react';
import { usePayPal } from '../../context/PayPalContext';
import { Button } from '../ui/Primitives';

interface PayPalCheckoutModalProps {
  open: boolean;
  caseId: string | null;
  productTitle?: string;
  sellerName?: string;
  amount?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PayPalCheckoutModal: React.FC<PayPalCheckoutModalProps> = ({
  open,
  caseId,
  productTitle = 'Selected Gift Item',
  sellerName = 'Verified Merchant',
  amount = '479.00 INR',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { account, openConnectModal } = usePayPal();

  if (!open || !caseId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 95,
        background: 'rgba(8, 10, 14, 0.76)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
    >
      <div
        className="surface-elevated"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '0',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* PayPal Top Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #001C63 0%, #003087 60%, #0070BA 100%)',
            padding: '16px 20px',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontStyle: 'italic',
                fontWeight: 900,
                fontSize: '20px',
                letterSpacing: '-1px',
                fontFamily: 'sans-serif',
                color: '#0079C1',
                background: '#FFFFFF',
                borderRadius: '6px',
                padding: '1px 8px',
                display: 'inline-block',
              }}
            >
              <span style={{ color: '#003087' }}>Pay</span>Pal
            </span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Checkout · Sandbox</div>
              <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={10} /> 256-Bit Encrypted Agent Authorization
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Linked Account Card */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Paying with PayPal Sandbox</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {account.buyerEmail}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                {account.fundingInstrument}
              </div>
            </div>
            <button
              onClick={openConnectModal}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-brass)',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Change
            </button>
          </div>

          {/* Item & Merchant Summary */}
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {productTitle}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <CheckCircle2 size={12} style={{ color: 'var(--accent-verified)' }} />
                  {sellerName}
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-brass)', fontFamily: 'var(--font-mono)' }}>
                {amount}
              </div>
            </div>

            <div
              style={{
                marginTop: '6px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: 'var(--text-muted)',
              }}
            >
              <span>Case ID: <strong className="mono" style={{ color: 'var(--text-secondary)' }}>{caseId}</strong></span>
              <span>Intent: <strong>AUTHORIZE_AND_CAPTURE</strong></span>
            </div>
          </div>

          {/* Mandate Firewall Guarantee */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(92, 184, 92, 0.08)',
              border: '1px solid rgba(92, 184, 92, 0.25)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <ShieldCheck size={18} style={{ color: 'var(--accent-verified)', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              <strong>Mandate Firewall Guard:</strong> Transaction is strictly validated against your spending rule. Payee, amount, and items are cryptographically sealed.
            </div>
          </div>

          {/* PayPal Payment Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '24px',
                background: '#FFC439',
                color: '#003087',
                border: 'none',
                fontWeight: 700,
                fontSize: '14.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'transform 0.1s ease',
              }}
            >
              {loading ? (
                <span>Capturing via PayPal Orders v2...</span>
              ) : (
                <>
                  <span>Pay with PayPal</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading} style={{ alignSelf: 'center' }}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
