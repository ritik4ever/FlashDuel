'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function HomePage() {
    const { isConnected } = useAccount();

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Hero */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="text-8xl mb-6">⚔️</div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-4">
                        Flash<span className="text-purple-500">Duel</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-4">1v1 Crypto Trading Battles</p>
                    <p className="text-lg text-gray-400 mb-6">
                        Same prices. Same assets. <span className="text-yellow-500 font-semibold">Winner takes all.</span>
                    </p>

                    <div className="inline-block bg-yellow-500/20 border border-yellow-500/50 rounded-full px-6 py-2 mb-8">
                        <span className="text-yellow-500 font-semibold">⚡ Powered by Yellow Network</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        {isConnected ? (
                            <Link href="/lobby">
                                <button className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-lg transition-all">
                                    Enter Lobby ⚔️
                                </button>
                            </Link>
                        ) : (
                            <ConnectButton />
                        )}
                        <a href="#how-it-works">
                            <button className="px-8 py-4 bg-gray-800 border border-gray-700 hover:border-purple-500 font-bold rounded-xl text-lg transition-all">
                                How It Works
                            </button>
                        </a>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-green-500">$0</p>
                            <p className="text-gray-400">Gas Per Trade</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-yellow-500">&lt;100ms</p>
                            <p className="text-gray-400">Execution</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-purple-500">5%</p>
                            <p className="text-gray-400">Platform Fee</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-4 bg-gray-800/50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { num: '1', icon: '💰', title: 'Stake USDC', desc: 'Create or join a match by staking test tokens.', color: 'bg-purple-600' },
                            { num: '2', icon: '📊', title: 'Trade & Compete', desc: 'Trade ETH, BTC, SOL at real-time prices. Zero gas.', color: 'bg-cyan-600' },
                            { num: '3', icon: '🏆', title: 'Winner Takes All', desc: 'Highest portfolio value wins 95% of prize pool.', color: 'bg-green-600' },
                        ].map((step) => (
                            <div key={step.num} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center">
                                <div className={`w-12 h-12 ${step.color} text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4`}>
                                    {step.num}
                                </div>
                                <div className="text-4xl mb-4">{step.icon}</div>
                                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                <p className="text-gray-400">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Yellow Network */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Why <span className="text-yellow-500">Yellow Network</span>?
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            State channels enable instant, gasless transactions while maintaining blockchain security.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: '⚡', title: 'Instant Trades', desc: 'Off-chain execution = zero latency' },
                            { icon: '🔒', title: 'Trustless', desc: 'Smart contracts ensure fair settlement' },
                            { icon: '💸', title: 'Zero Gas', desc: 'No fees for trading' },
                            { icon: '🌐', title: 'Multi-Chain', desc: 'Works across EVM chains' },
                        ].map((f) => (
                            <div key={f.title} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center">
                                <span className="text-4xl mb-4 block">{f.icon}</span>
                                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-400">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 bg-gray-800/50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Battle?</h2>
                    <p className="text-xl text-gray-400 mb-8">Join the arena and prove your trading skills</p>
                    {isConnected ? (
                        <Link href="/lobby">
                            <button className="px-12 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xl transition-all">
                                Enter the Lobby ⚔️
                            </button>
                        </Link>
                    ) : (
                        <ConnectButton />
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-gray-800">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">⚔️</span>
                        <span className="font-bold">FlashDuel</span>
                    </div>
                    <p className="text-sm text-gray-500">Built for ETHGlobal 2025 • Powered by Yellow Network</p>
                    <div className="flex gap-4">
                        <a href="https://github.com/ritik4ever/flashduel" target="_blank" className="text-gray-400 hover:text-white">GitHub</a>
                        <a href="https://yellow.org" target="_blank" className="text-gray-400 hover:text-yellow-500">Yellow Network</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
