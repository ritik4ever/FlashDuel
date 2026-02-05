'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    pulse?: boolean;
}

export function Badge({
    children,
    variant = 'neutral',
    size = 'md',
    pulse = false
}: BadgeProps) {
    const variants = {
        success: 'bg-green-500/20 text-green-400 border-green-500/30',
        danger: 'bg-red-500/20 text-red-400 border-red-500/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        neutral: 'bg-dark-600 text-dark-200 border-dark-500',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border font-medium',
                variants[variant],
                sizes[size]
            )}
        >
            {pulse && (
                <span className="relative flex h-2 w-2">
                    <span className={cn(
                        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                        variant === 'success' && 'bg-green-400',
                        variant === 'danger' && 'bg-red-400',
                        variant === 'info' && 'bg-cyan-400',
                    )} />
                    <span className={cn(
                        'relative inline-flex rounded-full h-2 w-2',
                        variant === 'success' && 'bg-green-500',
                        variant === 'danger' && 'bg-red-500',
                        variant === 'info' && 'bg-cyan-500',
                    )} />
                </span>
            )}
            {children}
        </span>
    );
}