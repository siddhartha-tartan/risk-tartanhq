import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  children: ReactNode;
}

export default function Card({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  children,
  className,
  ...props
}: CardProps) {
  const baseClasses = 'card rounded-xl';
  
  const variantClasses = {
    default: 'bg-surface-primary border border-gray-200 shadow-soft',
    elevated: 'bg-surface-primary shadow-medium border-0',
    outline: 'bg-surface-primary border-2 border-gray-200 shadow-none',
    filled: 'bg-surface-tertiary border border-gray-200 shadow-none'
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const hoverClasses = hoverable ? 'card-hover cursor-pointer' : '';

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        hoverClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 