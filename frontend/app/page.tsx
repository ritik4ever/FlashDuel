'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function HomePage() {
    const { isConnected } = useAccount();

    return (
        <div className="min-h-screen flex flex-col">
            <section className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-cyan-500/20 dark:from-primary/10 dark:to-cyan-500/10" />
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center relative z-10 max-w-3xl mx-auto"
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-8xl mb-8"
                    >
                        ⚔️
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6">
                        Flash<span className="text-primary">Duel</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted mb-8 max-w-xl mx-auto">
                        Trade against real opponents. Same prices. Same assets.
                        <span className="text-primary font-semibold"> Winner takes all.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Link href="/lobby">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-2xl text-lg transition-colors shadow-lg shadow-primary/25"
                            >
                                {isConnected ? 'Enter Lobby' : 'Start Playing'}
                            </motion.button>
                        </Link>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-card border border-card-border hover:bg-card-border/50 font-semibold rounded-2xl text-lg transition-colors"
                        >
                            How It Works
                        </motion.button>
                    </div>

                    <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary">$0</div>
                            <div className="text-muted text-sm">Gas Per Trade</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold">&lt;100ms</div>
                            <div className="text-muted text-sm">Execution</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-success">5%</div>
                            <div className="text-muted text-sm">Platform Fee</div>
                        </div>
                    </div>
                </motion.div>
            </section>

            <section className="py-20 px-4 bg-card/50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-card border border-card-border rounded-2xl p-6 text-center"
                        >
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">1️⃣</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Stake USDC</h3>
                            <p className="text-muted">Create or join a match by staking USDC against an opponent.</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-card-border rounded-2xl p-6 text-center"
                        >
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">2️⃣</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Trade & Compete</h3>
                            <p className="text-muted">Trade ETH, BTC, SOL at real prices. Instant execution, zero gas.</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-card border border-card-border rounded-2xl p-6 text-center"
                        >
                            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🏆</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Winner Takes All</h3>
                            <p className="text-muted">Higher portfolio value wins the entire prize pool (minus 5% fee).</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            <footer className="py-8 px-4 border-t border-card-border">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">⚔️</span>
                        <span className="font-bold">FlashDuel</span>
                    </div>
                    <p className="text-muted text-sm">Powered by Yellow Network State Channels</p>
                    <div className="flex gap-4">
                        <a href="#" className="text-muted hover:text-foreground transition-colors">Twitter</a>
                        <a href="#" className="text-muted hover:text-foreground transition-colors">Discord</a>
                        <a href="#" className="text-muted hover:text-foreground transition-colors">Docs</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}