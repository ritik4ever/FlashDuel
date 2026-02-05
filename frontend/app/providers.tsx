'use client';

import { ReactNode } from 'react';
import { WagmiConfig, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const config = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http(),
    },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
    return (
        <WagmiConfig config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: '#1e293b',
                            color: '#fff',
                            border: '1px solid #334155',
                        },
                        success: {
                            iconTheme: {
                                primary: '#22c55e',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </QueryClientProvider>
        </WagmiConfig>
    );
}