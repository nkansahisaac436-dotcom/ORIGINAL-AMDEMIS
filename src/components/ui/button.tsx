import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default:
          'bg-brand-navy text-white hover:bg-brand-midBlue border-b-2 border-brand-gold shadow-sm',
        primary:
          'bg-brand-midBlue text-white hover:bg-brand-navy shadow-sm',
        gold:
          'bg-brand-gold text-brand-navy font-semibold hover:bg-brand-goldHover shadow-sm',
        destructive:
          'bg-brand-error text-white hover:bg-red-700 shadow-sm',
        outline:
          'border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground',
        secondary:
          'bg-slate-200 dark:bg-slate-800 text-foreground hover:bg-slate-300 dark:hover:bg-slate-700',
        ghost:
          'hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground',
        link:
          'text-brand-midBlue underline-offset-4 hover:underline dark:text-blue-400 p-0 h-auto',
      },
      size: {
        default: 'h-11 px-5 py-2.5 text-base',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
