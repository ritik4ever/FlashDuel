'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from '@/components/ui/Button';
import { shortenAddress } from '@/lib/utils';
import { useGameStore } from '@/lib/store';
import { useEffect } from 'react';

export function ConnectButton() {
    const { address, isConnected } = useAccount();
    const { connect, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const { setConnected } = useGameStore();

    useEffect(() => {
        setConnected(isConnected, address);
    }, [isConnected, address, setConnected]);

    if (isConnected && address) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-dark-700 px-4 py-2 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-mono text-sm">{shortenAddress(address)}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => disconnect()}>
                    Disconnect
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={() => connect({ connector: injected() })}
            loading={isPending}
        >
            🦊 Connect Wallet
        </Button>
    );
}