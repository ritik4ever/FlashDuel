import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
    return (
        <div
            className={cn(
                'bg-card rounded-2xl border border-card-border',
                hover && 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all',
                className
            )}
        >
            {children}
        </div>
    );
}