
const YELLOW_WS_URL = process.env.NEXT_PUBLIC_YELLOW_WS_URL || 'wss://clearnet-sandbox.yellow.com/ws';

export interface YellowConfig {
  wsUrl: string;
  custodyAddress: string;
  adjudicatorAddress: string;
}

export const YELLOW_SEPOLIA_CONFIG: YellowConfig = {
  wsUrl: YELLOW_WS_URL,
  custodyAddress: '0x019B65A265EB3363822f2752141b3dF16131b262',
  adjudicatorAddress: '0x7c7ccbc98469190849BCC6c926307794fDfB11F2',
};

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface YellowMessage {
  type: string;
  payload?: unknown;
  error?: string;
}

export class YellowClient {
  private ws: WebSocket | null = null;
  private config: YellowConfig;
  private status: ConnectionStatus = 'disconnected';
  private messageHandlers: Map<string, (message: YellowMessage) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: YellowConfig = YELLOW_SEPOLIA_CONFIG) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.status = 'connecting';
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => {
        this.status = 'connected';
        this.reconnectAttempts = 0;
        console.log('Yellow Network connected');
        resolve();
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        console.log('Yellow Network disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        this.status = 'error';
        console.error('Yellow Network error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: YellowMessage = JSON.parse(event.data);
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message);
          }
        } catch (error) {
          console.error('Error parsing Yellow message:', error);
        }
      };
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting to Yellow in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = 'disconnected';
  }

  send(message: YellowMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('Yellow Network not connected');
    }
  }

  onMessage(type: string, handler: (message: YellowMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getConfig(): YellowConfig {
    return this.config;
  }
}

// Singleton instance
let yellowClientInstance: YellowClient | null = null;

export function getYellowClient(): YellowClient {
  if (!yellowClientInstance) {
    yellowClientInstance = new YellowClient();
  }
  return yellowClientInstance;
}
