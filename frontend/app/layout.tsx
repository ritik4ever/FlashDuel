import type { Metadata } from 'next';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import './globals.css';

export const metadata: Metadata = {
    title: 'FlashDuel - 1v1 Trading Battles',
    description: 'Trade against real opponents. Winner takes all.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-dark-950">
                <Providers>
                    <Navbar />
                    <main className="pt-16">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}