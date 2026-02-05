import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'FlashDuel - 1v1 Trading Battles',
    description: 'Trade against real opponents. Winner takes all. Powered by Yellow Network.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen pt-16`}>
                <Providers>
                    <Navbar />
                    <main>{children}</main>
                </Providers>
            </body>
        </html>
    );
}