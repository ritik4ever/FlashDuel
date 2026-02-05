import { create } from 'zustand';
import { Match, PriceData, Trade } from '@/types';

interface GameState {
    // Connection
    isConnected: boolean;
    address: string | null;

    // WebSocket
    ws: WebSocket | null;

    // Prices
    prices: PriceData | null;

    // Match
    currentMatch: Match | null;
    openMatches: Match[];

    // Actions
    setConnected: (connected: boolean, address?: string) => void;
    setWebSocket: (ws: WebSocket | null) => void;
    setPrices: (prices: PriceData) => void;
    setCurrentMatch: (match: Match | null) => void;
    setOpenMatches: (matches: Match[]) => void;
    updateMatch: (match: Match) => void;
    addTrade: (trade: Trade, playerAddress: string) => void;
    reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    isConnected: false,
    address: null,
    ws: null,
    prices: null,
    currentMatch: null,
    openMatches: [],

    setConnected: (connected, address) => set({
        isConnected: connected,
        address: address || null
    }),

    setWebSocket: (ws) => set({ ws }),

    setPrices: (prices) => set({ prices }),

    setCurrentMatch: (match) => set({ currentMatch: match }),

    setOpenMatches: (matches) => set({ openMatches: matches }),

    updateMatch: (match) => set({ currentMatch: match }),

    addTrade: (trade, playerAddress) => {
        const { currentMatch, address } = get();
        if (!currentMatch) return;

        const isPlayerA = currentMatch.playerA?.address === playerAddress;
        const player = isPlayerA ? 'playerA' : 'playerB';

        set({
            currentMatch: {
                ...currentMatch,
                [player]: currentMatch[player] ? {
                    ...currentMatch[player]!,
                    trades: [...currentMatch[player]!.trades, trade],
                    tradesCount: currentMatch[player]!.tradesCount + 1,
                } : null,
            },
        });
    },

    reset: () => set({
        currentMatch: null,
        openMatches: [],
    }),
}));