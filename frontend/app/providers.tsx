'use client';

import { ReactNode, useEffect, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { ThemeProvider, useTheme } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
    appName: 'FlashDuel',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || 'demo',
    chains: [sepolia, base],
    transports: {
        [sepolia.id]: http(),
        [base.id]: http(),
    },
    ssr: true,
});

const queryClient = new QueryClient();

function RainbowKitWrapper({ children }: { children: ReactNode }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <RainbowKitProvider
            theme={resolvedTheme === 'dark' ? darkTheme({
                accentColor: '#8B5CF6',
                accentColorForeground: 'white',
                borderRadius: 'large',
            }) : lightTheme({
                accentColor: '#8B5CF6',
                accentColorForeground: 'white',
                borderRadius: 'large',
            })}
        >
            {children}
        </RainbowKitProvider>
    );
}

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <RainbowKitWrapper>
                        {children}
                    </RainbowKitWrapper>
                </QueryClientProvider>
            </WagmiProvider>
        </ThemeProvider>
    );
}