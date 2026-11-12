import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export interface PayPalAccount {
  connected: boolean;
  buyerEmail: string;
  payerId: string;
  balanceINR: string;
  balanceUSD: string;
  fundingInstrument: string;
  mode: 'sandbox' | 'live';
}

interface PayPalContextValue {
  account: PayPalAccount;
  connect: (email: string, payerId?: string) => void;
  disconnect: () => void;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  isConnectModalOpen: boolean;
}

const STORAGE_KEY = 'mandate_paypal_sandbox_account';

const PayPalContext = createContext<PayPalContextValue | undefined>(undefined);

export const PayPalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const defaultEmail = user?.email
    ? user.email.replace('@', '-buyer@sandbox.')
    : 'vinay-buyer@sandbox.paypal.com';

  const [account, setAccount] = useState<PayPalAccount>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as PayPalAccount;
      }
    } catch {
      // ignore
    }
    return {
      connected: true,
      buyerEmail: defaultEmail,
      payerId: 'PAYER-SANDBOX-VINAY-8821',
      balanceINR: '₹50,000.00',
      balanceUSD: '$650.00',
      fundingInstrument: 'PayPal Balance & Visa Debit (•••• 4242)',
      mode: 'sandbox',
    };
  });

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    } catch {
      // ignore
    }
  }, [account]);

  const connect = (email: string, payerId?: string) => {
    setAccount({
      connected: true,
      buyerEmail: email.trim() || defaultEmail,
      payerId: payerId || `PAYER-SB-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      balanceINR: '₹50,000.00',
      balanceUSD: '$650.00',
      fundingInstrument: 'PayPal Balance & Linked Bank (•••• 4242)',
      mode: 'sandbox',
    });
    setIsConnectModalOpen(false);
  };

  const disconnect = () => {
    setAccount((prev) => ({ ...prev, connected: false }));
  };

  return (
    <PayPalContext.Provider
      value={{
        account,
        connect,
        disconnect,
        openConnectModal: () => setIsConnectModalOpen(true),
        closeConnectModal: () => setIsConnectModalOpen(false),
        isConnectModalOpen,
      }}
    >
      {children}
    </PayPalContext.Provider>
  );
};

export function usePayPal(): PayPalContextValue {
  const ctx = useContext(PayPalContext);
  if (!ctx) {
    throw new Error('usePayPal must be used within a PayPalProvider');
  }
  return ctx;
}
