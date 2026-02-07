'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LivePrices } from '@/components/LivePrices';

export default function HomePage() {
    const { isConnected } = useAccount();

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 px-4 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10 pointer-events-none" />

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    {/* Animated Logo */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', duration: 1 }}
                        className="text-8xl mb-6"
                    >
                        ⚔️
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-7xl font-bold mb-4"
                    >
                        <span className="text-foreground">Flash</span>
                        <span className="text-primary">Duel</span>
                    </motion.h1>

                    {/* Tagline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl md:text-2xl text-muted mb-8 max-w-2xl mx-auto"
                    >
                        Trade against real opponents. Same prices. Same assets.{' '}
                        <span className="text-primary font-semibold">Winner takes all.</span>
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
                    >
                        {isConnected ? (
                            <Link href="/lobby">
                                <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-primary/25">
                                    Enter Lobby
                                </button>
                            </Link>
                        ) : (
                            <ConnectButton />
                        )}
                        <a href="#how-it-works">
                            <button className="px-8 py-4 bg-card border border-card-border hover:border-primary/50 font-bold rounded-xl text-lg transition-all">
                                How It Works
                            </button>
                        </a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap justify-center gap-8 md:gap-16"
                    >
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-primary">$0</p>
                            <p className="text-muted">Gas Per Trade</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-cyan-500">&lt;100ms</p>
                            <p className="text-muted">Execution</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-green-500">5%</p>
                            <p className="text-muted">Platform Fee</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Live Prices Section */}
            <section className="py-12 px-4 bg-card/50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-6">📈 Live Market Prices</h2>
                    <LivePrices />
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold text-center mb-12"
                    >
                        How It Works
                    </motion.h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-card-border rounded-2xl p-6 text-center hover:border-primary/50 transition-all"
                        >
                            <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                1
                            </div>
                            <h3 className="text-xl font-bold mb-2">💰 Stake USDC</h3>
                            <p className="text-muted">
                                Create or join a match by staking USDC against an opponent. Funds are locked in a smart contract.
                            </p>
                        </motion.div>

                        {/* Step 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-card border border-card-border rounded-2xl p-6 text-center hover:border-primary/50 transition-all"
                        >
                            <div className="w-12 h-12 bg-cyan-500 text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                2
                            </div>
                            <h3 className="text-xl font-bold mb-2">📊 Trade & Compete</h3>
                            <p className="text-muted">
                                Trade ETH, BTC, SOL at real-time prices. Instant execution, zero gas fees during the match.
                            </p>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="bg-card border border-card-border rounded-2xl p-6 text-center hover:border-primary/50 transition-all"
                        >
                            <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                🏆
                            </div>
                            <h3 className="text-xl font-bold mb-2">Winner Takes All</h3>
                            <p className="text-muted">
                                Higher portfolio value wins the entire prize pool (minus 5% fee). Results recorded on-chain.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 bg-card/30">
                <div className="max-w-6xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold text-center mb-12"
                    >
                        Why FlashDuel?
                    </motion.h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon="⚡"
                            title="Instant Trades"
                            description="Off-chain execution means zero latency and no gas fees during matches"
                        />
                        <FeatureCard
                            icon="🔒"
                            title="Trustless Escrow"
                            description="Stakes locked in audited smart contracts until match settles"
                        />
                        <FeatureCard
                            icon="📈"
                            title="Real Prices"
                            description="Trade at live market prices from CoinGecko, updated every 10 seconds"
                        />
                        <FeatureCard
                            icon="🏆"
                            title="On-Chain Leaderboard"
                            description="Your wins, earnings, and stats recorded on Ethereum forever"
                        />
                    </div>
                </div>
            </section>

            {/* Game Flow Visualization */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold text-center mb-12"
                    >
                        Match Flow
                    </motion.h2>

                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-card-border hidden md:block" />

                        {/* Timeline items */}
                        <div className="space-y-8">
                            <TimelineItem
                                side="left"
                                icon="🎮"
                                title="Player A Creates Match"
                                description="Stakes $50 USDC → Locked in smart contract"
                            />
                            <TimelineItem
                                side="right"
                                icon="🤝"
                                title="Player B Joins"
                                description="Stakes $50 USDC → Prize pool is now $100"
                            />
                            <TimelineItem
                                side="left"
                                icon="⚔️"
                                title="Trading Battle Begins"
                                description="5 minutes to trade ETH, BTC, SOL"
                            />
                            <TimelineItem
                                side="right"
                                icon="📊"
                                title="Real-Time Competition"
                                description="Both players see live portfolio values"
                            />
                            <TimelineItem
                                side="left"
                                icon="⏰"
                                title="Timer Ends"
                                description="Final portfolio values compared"
                            />
                            <TimelineItem
                                side="right"
                                icon="🏆"
                                title="Winner Announced"
                                description="$95 sent to winner (5% fee taken)"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-primary/20 to-cyan-500/20">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold mb-4"
                    >
                        Ready to Battle?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted mb-8"
                    >
                        Join the arena and prove your trading skills
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        {isConnected ? (
                            <Link href="/lobby">
                                <button className="px-12 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xl transition-all hover:scale-105 shadow-lg shadow-primary/25">
                                    Enter the Lobby ⚔️
                                </button>
                            </Link>
                        ) : (
                            <ConnectButton />
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-card-border">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">⚔️</span>
                        <span className="font-bold">FlashDuel</span>
                    </div>
                    <p className="text-sm text-muted">
                        Built for ETHGlobal HackMoney 2026 • Powered by Yellow Network
                    </p>
                    <div className="flex gap-4">
                        <a
                            href="https://github.com/ritik4ever/flashduel"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted hover:text-foreground transition-colors"
                        >
                            GitHub
                        </a>
                        <a
                            href="https://sepolia.etherscan.io/address/0x7c1d47ED0aFC7efCc2d6592b7Da3D838D97A00B4"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted hover:text-foreground transition-colors"
                        >
                            Contract
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-card border border-card-border rounded-2xl p-6 text-center hover:border-primary/50 transition-all"
        >
            <span className="text-4xl mb-4 block">{icon}</span>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-sm text-muted">{description}</p>
        </motion.div>
    );
}

// Timeline Item Component
function TimelineItem({
    side,
    icon,
    title,
    description,
}: {
    side: 'left' | 'right';
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: side === 'left' ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`flex items-center gap-4 ${side === 'right' ? 'md:flex-row-reverse' : ''}`}
        >
            <div className={`flex-1 ${side === 'right' ? 'md:text-right' : ''}`}>
                <div className={`bg-card border border-card-border rounded-xl p-4 inline-block ${side === 'right' ? 'md:ml-auto' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{icon}</span>
                        <h4 className="font-bold">{title}</h4>
                    </div>
                    <p className="text-sm text-muted">{description}</p>
                </div>
            </div>
            <div className="w-4 h-4 bg-primary rounded-full border-4 border-background hidden md:block" />
            <div className="flex-1 hidden md:block" />
        </motion.div>
    );
}