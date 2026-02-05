'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2';

    const variants = {
        primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
        secondary: 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-500',
        danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25',
        ghost: 'bg-transparent hover:bg-dark-700 text-dark-200',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-8 py-3.5 text-lg',
    };

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            disabled={disabled || loading}
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                (disabled || loading) && 'opacity-50 cursor-not-allowed',
                className
            )}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4\" viewBox="0 0 24 24">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </motion.button>
    );
}