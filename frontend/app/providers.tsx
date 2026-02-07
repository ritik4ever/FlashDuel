'use client';

import { ReactNode, useEffect, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { ThemeProvider, useTheme } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';

// Create config outside component to avoid re-creation
const config = getDefaultConfig({
    appName: 'FlashDuel',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || 'demo-project-id',
    chains: [sepolia],
    transports: {
        [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    },
    ssr: true, // Enable SSR mode
});

// Create query client outside component
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
        },
    },
});

function RainbowKitWrapper({ children }: { children: ReactNode }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    {mounted ? (
                        <RainbowKitWrapper>
                            {children}
                        </RainbowKitWrapper>
                    ) : (
                        // Show children without RainbowKit during SSR
                        <>{children}</>
                    )}
                </QueryClientProvider>
            </WagmiProvider>
        </ThemeProvider>
    );
}