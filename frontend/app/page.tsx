'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useGameStore } from '@/lib/store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect } from 'react';

export default function HomePage() {
    const { isConnected, prices } = useGameStore();
    useWebSocket(); // Initialize WebSocket connection

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 via-transparent to-transparent" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
                                <span className="text-white">1v1 Trading</span>
                                <br />
                                <span className="gradient-text">Battles</span>
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mt-6 text-xl text-dark-300 max-w-2xl mx-auto"
                        >
                            Trade against real opponents. Same assets, same prices, same time limit.
                            <br />
                            <span className="text-white font-semibold">Winner takes all.</span>
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            {isConnected ? (
                                <Link href="/lobby">
                                    <Button size="lg" className="w-full sm:w-auto">
                                        ⚔️ Enter Lobby
                                    </Button>
                                </Link>
                            ) : (
                                <Button size="lg" disabled>
                                    Connect Wallet to Play
                                </Button>
                            )}
                            <Button variant="secondary" size="lg">
                                📖 How it Works
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="p-6 h-full">
                                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Instant Trades</h3>
                                <p className="text-dark-300">
                                    All trades execute instantly via Yellow Network state channels.
                                    No gas fees, no waiting.
                                </p>
                            </Card>
                        </motion.div>

                        {/* Feature 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Card className="p-6 h-full">
                                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                                    <span className="text-2xl">🎯</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Fair Competition</h3>
                                <p className="text-dark-300">
                                    Both players see the same prices and have the same starting balance.
                                    Pure skill, no advantages.
                                </p>
                            </Card>
                        </motion.div>

                        {/* Feature 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="p-6 h-full">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                                    <span className="text-2xl">🏆</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Winner Takes All</h3>
                                <p className="text-dark-300">
                                    The player with the higher portfolio value at the end wins the entire prize pool.
                                </p>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-800/50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-white mb-16">How It Works</h2>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { step: '1', title: 'Stake', desc: 'Both players stake equal USDC' },
                            { step: '2', title: 'Trade', desc: 'Trade ETH, BTC, SOL for 5 minutes' },
                            { step: '3', title: 'Compete', desc: 'Try to maximize your portfolio' },
                            { step: '4', title: 'Win', desc: 'Higher value takes the pot' },
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-dark-300">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Live Prices Section */}
            {prices && (
                <section className="py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl font-bold text-center text-white mb-8">Live Prices</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { name: 'Ethereum', symbol: 'ETH', price: prices.eth, color: '#627EEA' },
                                { name: 'Bitcoin', symbol: 'BTC', price: prices.btc, color: '#F7931A' },
                                { name: 'Solana', symbol: 'SOL', price: prices.sol, color: '#00FFA3' },
                            ].map((asset) => (
                                <Card key={asset.symbol} className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                                style={{ backgroundColor: asset.color + '30' }}
                                            >
                                                {asset.symbol[0]}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{asset.name}</div>
                                                <div className="text-sm text-dark-400">{asset.symbol}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-white font-mono">
                                                ${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}