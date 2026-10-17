import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-kufi font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-copper disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-copper text-ink hover:bg-[#c98340]',
        outline: 'border border-copper text-copper hover:bg-copper/10',
        ghost: 'text-[#cfc8bf] hover:bg-steel/60',
        danger: 'bg-[#c62828] text-white hover:bg-[#d93535]',
      },
      size: { default: 'h-10 px-4', sm: 'h-8 px-3 text-xs', lg: 'h-12 px-6 text-base' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
});
Button.displayName = 'Button';
