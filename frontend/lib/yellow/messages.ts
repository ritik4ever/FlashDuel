
export interface OpenSessionMessage {
  type: 'open_session';
  payload: {
    address: string;
    amount: string;
    token: string;
  };
}

export interface CloseSessionMessage {
  type: 'close_session';
  payload: {
    sessionId: string;
  };
}

export interface SessionOpenedMessage {
  type: 'session_opened';
  payload: {
    sessionId: string;
    channelId: string;
    balance: string;
  };
}

export interface SessionClosedMessage {
  type: 'session_closed';
  payload: {
    sessionId: string;
    finalBalance: string;
  };
}

// Trade messages
export interface TradeMessage {
  type: 'trade';
  payload: {
    sessionId: string;
    side: 'buy' | 'sell';
    baseAsset: string;
    quoteAsset: string;
    amount: string;
    price: string;
  };
}

export interface TradeExecutedMessage {
  type: 'trade_executed';
  payload: {
    tradeId: string;
    sessionId: string;
    side: 'buy' | 'sell';
    baseAsset: string;
    quoteAsset: string;
    amount: string;
    price: string;
    fee: string;
    timestamp: number;
  };
}

export interface TradeErrorMessage {
  type: 'trade_error';
  payload: {
    error: string;
    code: number;
  };
}

// Balance messages
export interface BalanceUpdateMessage {
  type: 'balance_update';
  payload: {
    sessionId: string;
    balances: {
      [asset: string]: string;
    };
  };
}

// Error messages
export interface ErrorMessage {
  type: 'error';
  payload: {
    message: string;
    code: number;
  };
}

// Union type for all messages
export type YellowNetworkMessage =
  | OpenSessionMessage
  | CloseSessionMessage
  | SessionOpenedMessage
  | SessionClosedMessage
  | TradeMessage
  | TradeExecutedMessage
  | TradeErrorMessage
  | BalanceUpdateMessage
  | ErrorMessage;

// Message type guards
export function isSessionOpened(msg: unknown): msg is SessionOpenedMessage {
  return (msg as SessionOpenedMessage).type === 'session_opened';
}

export function isSessionClosed(msg: unknown): msg is SessionClosedMessage {
  return (msg as SessionClosedMessage).type === 'session_closed';
}

export function isTradeExecuted(msg: unknown): msg is TradeExecutedMessage {
  return (msg as TradeExecutedMessage).type === 'trade_executed';
}

export function isTradeError(msg: unknown): msg is TradeErrorMessage {
  return (msg as TradeErrorMessage).type === 'trade_error';
}

export function isBalanceUpdate(msg: unknown): msg is BalanceUpdateMessage {
  return (msg as BalanceUpdateMessage).type === 'balance_update';
}

export function isError(msg: unknown): msg is ErrorMessage {
  return (msg as ErrorMessage).type === 'error';
}
