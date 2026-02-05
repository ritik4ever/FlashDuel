'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/lib/store';
import { shortenAddress } from '@/lib/utils';

export function ConnectButton() {
    const { address, isConnected } = useAccount();
    const { connect, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const { setConnected, setAddress } = useGameStore();

    useEffect(() => {
        setConnected(isConnected);
        setAddress(address || null);
    }, [isConnected, address, setConnected, setAddress]);

    if (isConnected && address) {
        return (
            <div className="flex items-center gap-3">
                <div className="bg-dark-700 px-4 py-2 rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-white font-semibold">{shortenAddress(address)}</span>
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
            Connect Wallet
        </Button>
    );
}