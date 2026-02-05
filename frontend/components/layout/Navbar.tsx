'use client';

import Link from 'next/link';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useGameStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';

export function Navbar() {
    const { prices, currentMatch } = useGameStore();

    return (
        <nav className="fixed top-0 left-0 right-0 z-30 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl">⚔️</span>
                        <span className="text-xl font-bold gradient-text">FlashDuel</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            href="/lobby"
                            className="text-dark-300 hover:text-white transition-colors"
                        >
                            Lobby
                        </Link>
                        {currentMatch && (
                            <Link
                                href={`/match/${currentMatch.id}`}
                                className="flex items-center gap-2"
                            >
                                <Badge variant="success" pulse>
                                    Live Match
                                </Badge>
                            </Link>
                        )}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Price Ticker */}
                        {prices && (
                            <div className="hidden lg:flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-dark-400">ETH</span>
                                    <span className="font-mono text-white">
                                        ${prices.eth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-dark-400">BTC</span>
                                    <span className="font-mono text-white">
                                        ${prices.btc.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>
                        )}

                        <ConnectButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}