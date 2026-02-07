

import { getYellowClient, YellowClient } from './client';

export interface Session {
  id: string;
  channelId: string;
  address: string;
  balance: number;
  status: 'opening' | 'active' | 'closing' | 'closed';
  createdAt: number;
}

export interface SessionBalance {
  usdc: number;
  eth: number;
  btc: number;
  sol: number;
}

export class YellowSession {
  private client: YellowClient;
  private session: Session | null = null;
  private balances: SessionBalance = { usdc: 0, eth: 0, btc: 0, sol: 0 };

  constructor() {
    this.client = getYellowClient();
  }

  async open(address: string, amount: number): Promise<Session> {
    // For demo/hackathon: Simulate session opening
    // In production, this would interact with Yellow Network

    console.log(`Opening Yellow session for ${address} with ${amount} USDC`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.session = {
      id: `session_${Date.now()}`,
      channelId: `channel_${Date.now()}`,
      address,
      balance: amount,
      status: 'active',
      createdAt: Date.now(),
    };

    this.balances = {
      usdc: amount,
      eth: 0,
      btc: 0,
      sol: 0,
    };

    console.log('Yellow session opened:', this.session);
    return this.session;
  }

  async close(): Promise<{ finalBalance: number }> {
    if (!this.session) {
      throw new Error('No active session');
    }

    console.log('Closing Yellow session:', this.session.id);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalBalance = this.calculateTotalValue();

    this.session.status = 'closed';

    console.log('Yellow session closed. Final balance:', finalBalance);

    return { finalBalance };
  }

  async trade(
    side: 'buy' | 'sell',
    asset: 'eth' | 'btc' | 'sol',
    amount: number,
    price: number
  ): Promise<{ success: boolean; newBalances: SessionBalance }> {
    if (!this.session || this.session.status !== 'active') {
      throw new Error('No active session');
    }

    const cost = amount * price;

    if (side === 'buy') {
      if (this.balances.usdc < cost) {
        throw new Error('Insufficient USDC balance');
      }
      this.balances.usdc -= cost;
      this.balances[asset] += amount;
    } else {
      if (this.balances[asset] < amount) {
        throw new Error(`Insufficient ${asset.toUpperCase()} balance`);
      }
      this.balances[asset] -= amount;
      this.balances.usdc += cost;
    }

    console.log(`Trade executed: ${side} ${amount} ${asset} @ $${price}`);
    console.log('New balances:', this.balances);

    return {
      success: true,
      newBalances: { ...this.balances },
    };
  }

  getSession(): Session | null {
    return this.session;
  }

  getBalances(): SessionBalance {
    return { ...this.balances };
  }

  calculateTotalValue(prices?: { eth: number; btc: number; sol: number }): number {
    const p = prices || { eth: 3000, btc: 95000, sol: 200 };
    return (
      this.balances.usdc +
      this.balances.eth * p.eth +
      this.balances.btc * p.btc +
      this.balances.sol * p.sol
    );
  }

  isActive(): boolean {
    return this.session?.status === 'active';
  }
}

// Session manager singleton
let sessionInstance: YellowSession | null = null;

export function getYellowSession(): YellowSession {
  if (!sessionInstance) {
    sessionInstance = new YellowSession();
  }
  return sessionInstance;
}

export function createNewSession(): YellowSession {
  sessionInstance = new YellowSession();
  return sessionInstance;
}
