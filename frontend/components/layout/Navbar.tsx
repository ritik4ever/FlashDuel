'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { formatUSD } from '@/lib/utils';

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-card border border-card-border hover:bg-primary/10 transition-all"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
            ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
            )}
        </button>
    );
}

export function Navbar() {
    const { balance, isConnected } = useGameStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-card-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl">⚔️</span>
                        <span className="text-xl font-bold">
                            Flash<span className="text-primary">Duel</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {mounted && isConnected && (
                            <>
                                <Link
                                    href="/lobby"
                                    className="text-muted hover:text-foreground transition-colors font-medium"
                                >
                                    Lobby
                                </Link>
                                <div className="bg-card border border-card-border px-4 py-2 rounded-xl">
                                    <span className="text-muted text-sm">Balance:</span>
                                    <span className="font-semibold ml-2">{formatUSD(balance)}</span>
                                </div>
                            </>
                        )}
                        <ThemeToggle />
                        {mounted && <ConnectButton showBalance={false} />}
                    </div>
                </div>
            </div>
        </nav>
    );
}