import { create } from 'zustand';

interface Portfolio {
    usdc: number;
    assets: { [key: string]: number };
}

interface Match {
    id: string;
    playerA: string;
    playerB: string | null;
    stakeAmount: number;
    prizePool: number;
    duration: number;
    status: 'waiting' | 'active' | 'completed';
    startedAt: number;
    createdAt: number;
    portfolioA: Portfolio;
    portfolioB: Portfolio;
    winner: string | null;
}

interface GameState {
    isConnected: boolean;
    address: string | null;
    balance: number;
    openMatches: Match[];
    currentMatch: Match | null;
    portfolio: Portfolio;

    setConnected: (connected: boolean) => void;
    setAddress: (address: string | null) => void;
    setBalance: (balance: number) => void;
    setOpenMatches: (matches: Match[]) => void;
    setCurrentMatch: (match: Match | null) => void;
    updatePortfolio: (portfolio: Portfolio) => void;
    reset: () => void;
}

const initialState = {
    isConnected: false,
    address: null,
    balance: 1000,
    openMatches: [],
    currentMatch: null,
    portfolio: { usdc: 0, assets: {} },
};

export const useGameStore = create<GameState>((set) => ({
    ...initialState,

    setConnected: (connected) => set({ isConnected: connected }),
    setAddress: (address) => set({ address }),
    setBalance: (balance) => set({ balance }),
    setOpenMatches: (matches) => set({ openMatches: matches }),
    setCurrentMatch: (match) => set({ currentMatch: match }),
    updatePortfolio: (portfolio) => set({ portfolio }),
    reset: () => set(initialState),
}));