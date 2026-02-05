import { cn } from '@/lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Badge({ children, variant = 'primary', size = 'md', className }: BadgeProps) {
    const variants = {
        primary: 'bg-primary-500/20 text-primary-400',
        success: 'bg-green-500/20 text-green-400',
        warning: 'bg-yellow-500/20 text-yellow-400',
        danger: 'bg-red-500/20 text-red-400',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    return (
        <span className={cn('font-semibold rounded-full', variants[variant], sizes[size], className)}>
            {children}
        </span>
    );
}