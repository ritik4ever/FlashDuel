'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    glow?: 'green' | 'red' | 'cyan' | 'none';
}

export function Card({ children, className, hover = false, glow = 'none' }: CardProps) {
    const glowStyles = {
        green: 'glow-green',
        red: 'glow-red',
        cyan: 'glow-cyan',
        none: '',
    };

    return (
        <div
            className={cn(
                'bg-dark-800/80 backdrop-blur-xl rounded-2xl border border-dark-700',
                hover && 'card-hover cursor-pointer',
                glowStyles[glow],
                className
            )}
        >
            {children}
        </div>
    );
}