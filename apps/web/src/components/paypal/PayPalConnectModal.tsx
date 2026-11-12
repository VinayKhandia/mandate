import React, { useState } from 'react';
import { CheckCircle2, Shield, Wallet, X } from 'lucide-react';
import { usePayPal } from '../../context/PayPalContext';
import { Button } from '../ui/Primitives';

export const PayPalConnectModal: React.FC = () => {
  const { account, connect, disconnect, closeConnectModal, isConnectModalOpen } = usePayPal();
  const [tab, setTab] = useState<'sandbox' | 'production'>('sandbox');
  const [email, setEmail] = useState(account.buyerEmail);
  const [liveEmail, setLiveEmail] = useState('');
  const [liveClientId, setLiveClientId] = useState('');

  if (!isConnectModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(10, 12, 16, 0.72)',
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
          maxWidth: '500px',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#003087',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '15px',
                fontFamily: 'sans-serif',
              }}
            >
              P
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>PayPal Account & Firewall Binding</h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
                Autonomous AI Agent Authorized Payer
              </p>
            </div>
          </div>
          <button
            onClick={closeConnectModal}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Toggle: Sandbox vs Production */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            padding: '3px',
            borderRadius: '6px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setTab('sandbox')}
            style={{
              padding: '7px 10px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: tab === 'sandbox' ? 600 : 400,
              border: 'none',
              cursor: 'pointer',
              background: tab === 'sandbox' ? 'var(--bg-elevated)' : 'transparent',
              color: tab === 'sandbox' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            Sandbox Demo Mode
          </button>
          <button
            onClick={() => setTab('production')}
            style={{
              padding: '7px 10px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: tab === 'production' ? 600 : 400,
              border: 'none',
              cursor: 'pointer',
              background: tab === 'production' ? 'var(--bg-elevated)' : 'transparent',
              color: tab === 'production' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            Live Production PayPal
          </button>
        </div>

        {tab === 'sandbox' ? (
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sandbox Status:</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: account.connected ? 'var(--accent-verified)' : 'var(--accent-warning)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {account.connected ? (
                  <>
                    <CheckCircle2 size={13} /> Sandbox Wallet Ready
                  </>
                ) : (
                  'Disconnected'
                )}
              </span>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Sandbox Buyer Email (Custom or Default):
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. buyer@sandbox.paypal.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-main)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Preloaded Sandbox Balance</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {account.balanceINR}
                </div>
              </div>
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>USD Equivalent</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {account.balanceUSD}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
              Connect Live PayPal Account (Production / Vault)
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              In production, users authorize Mandate once via PayPal Vault / Billing Agreements. The agent can only execute PayPal Orders v2 charges strictly bounded by the user's active Mandate spending rules.
            </p>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Your PayPal Account Email:
              </label>
              <input
                type="email"
                value={liveEmail}
                onChange={(e) => setLiveEmail(e.target.value)}
                placeholder="your-paypal-email@domain.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-main)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                PayPal Client ID (Optional for Direct API):
              </label>
              <input
                type="text"
                value={liveClientId}
                onChange={(e) => setLiveClientId(e.target.value)}
                placeholder="Live PayPal REST App Client ID"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-main)',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                lineHeight: 1.4,
                padding: '6px 8px',
                background: 'var(--bg-elevated)',
                borderRadius: '4px',
              }}
            >
              🔒 <strong>Non-Custodial Architecture:</strong> Mandate never stores your PayPal password or raw bank credentials. All fund movements use PayPal's official OAuth tokens with idempotency protection.
            </div>
          </div>
        )}

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(182, 154, 112, 0.08)',
            border: '1px solid rgba(182, 154, 112, 0.25)',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            display: 'flex',
            gap: '8px',
          }}
        >
          <Shield size={16} style={{ color: 'var(--accent-brass)', flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Mandate Firewall Protection:</strong> The autonomous agent cannot exceed your mandate limit regardless
            of your connected PayPal wallet balance. All orders use PayPal Orders v2 with cryptographic ledger receipts.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '6px' }}>
          {account.connected ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                disconnect();
                closeConnectModal();
              }}
            >
              Disconnect
            </Button>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={closeConnectModal}>
              Cancel
            </Button>
            <Button
              variant="brass"
              size="sm"
              icon={<Wallet size={13} />}
              onClick={() => {
                if (tab === 'production') {
                  connect(liveEmail || 'vinay.khandia@paypal.com', liveClientId || 'LIVE-VAULT-TOKEN-MANDATE');
                } else {
                  connect(email || 'vinay-buyer@sandbox.paypal.com');
                }
              }}
            >
              {tab === 'production' ? 'Link Live PayPal Vault' : 'Save & Link Sandbox'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
