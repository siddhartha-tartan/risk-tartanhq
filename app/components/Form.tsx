import { ReactNode, InputHTMLAttributes, LabelHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';

// Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  variant = 'default',
  leftIcon,
  rightIcon,
  className,
  ...props
}: InputProps) {
  const baseClasses = 'form-input';
  
  const variantClasses = {
    default: 'border-gray-300 focus:border-brand-500 focus:ring-brand-500',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500'
  };

  const inputClasses = cn(
    baseClasses,
    variantClasses[variant],
    leftIcon ? 'pl-10' : '',
    rightIcon ? 'pr-10' : '',
    className
  );

  if (leftIcon || rightIcon) {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input className={inputClasses} {...props} />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }

  return <input className={inputClasses} {...props} />;
}

// Label Component
interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, children, className, ...props }: LabelProps) {
  return (
    <label className={cn('form-label', className)} {...props}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

// FormField Component
interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  className
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <Label required={required}>{label}</Label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Textarea Component
interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error' | 'success';
}

export function Textarea({
  variant = 'default',
  className,
  ...props
}: TextareaProps) {
  const baseClasses = 'form-input resize-none';
  
  const variantClasses = {
    default: 'border-gray-300 focus:border-brand-500 focus:ring-brand-500',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500'
  };

  return (
    <textarea
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
} 