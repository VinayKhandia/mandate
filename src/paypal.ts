// src/paypal.ts
import { Currency } from './types.js';

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PayPalCaptureResult {
  success: boolean;
  captureId?: string;
  status: string;
  raw?: any;
}

export interface PayPalVoidResult {
  success: boolean;
  status: string;
  raw?: any;
}

export class PayPalService {
  private clientId: string;
  private clientSecret: string;
  private apiBase: string;
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.apiBase = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Determine if we are running with real sandbox credentials or mock mode.
   */
  public isMockMode(): boolean {
    return (
      !this.clientId ||
      !this.clientSecret ||
      this.clientId === 'mock_client_id' ||
      this.clientSecret === 'mock_client_secret'
    );
  }

  /**
   * Fetch OAuth2 access token from PayPal Sandbox.
   */
  public async getAccessToken(): Promise<string> {
    if (this.isMockMode()) {
      return 'mock_sandbox_access_token';
    }

    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiresAt - 60000) {
      return this.cachedToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`${this.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PayPal OAuth2 failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as PayPalTokenResponse;
    this.cachedToken = data.access_token;
    this.tokenExpiresAt = now + data.expires_in * 1000;
    return this.cachedToken;
  }

  /**
   * Capture an authorized PayPal Order.
   */
  public async captureOrder(orderId: string): Promise<PayPalCaptureResult> {
    if (this.isMockMode()) {
      return {
        success: true,
        captureId: `MOCK-CAP-${Date.now()}`,
        status: 'COMPLETED',
      };
    }

    const token = await this.getAccessToken();
    const response = await fetch(`${this.apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data: any = await response.json();
    if (!response.ok) {
      return {
        success: false,
        status: 'FAILED',
        raw: data,
      };
    }

    const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id || data.id;
    return {
      success: true,
      captureId,
      status: data.status || 'COMPLETED',
      raw: data,
    };
  }

  /**
   * Void an authorized payment on PayPal.
   */
  public async voidAuthorization(authorizationId: string): Promise<PayPalVoidResult> {
    if (this.isMockMode()) {
      return {
        success: true,
        status: 'VOIDED',
      };
    }

    const token = await this.getAccessToken();
    const response = await fetch(`${this.apiBase}/v2/payments/authorizations/${authorizationId}/void`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 204) {
      return { success: true, status: 'VOIDED' };
    }

    const data: any = await response.json();
    return {
      success: response.ok,
      status: response.ok ? 'VOIDED' : 'FAILED',
      raw: data,
    };
  }
}

export const paypalService = new PayPalService();
