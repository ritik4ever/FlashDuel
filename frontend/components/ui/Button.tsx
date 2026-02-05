import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    className,
    disabled,
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2';

    const variants = {
        primary: 'bg-primary hover:bg-primary-hover text-white disabled:bg-muted disabled:text-muted',
        secondary: 'bg-card border border-card-border hover:bg-card-border/50 disabled:opacity-50',
        success: 'bg-success hover:bg-success/90 text-white',
        danger: 'bg-danger hover:bg-danger/90 text-white',
        ghost: 'bg-transparent hover:bg-card text-muted hover:text-foreground',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {children}
        </motion.button>
    );
}