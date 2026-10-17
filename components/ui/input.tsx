import * as React from 'react';
import { cn } from '@/lib/utils';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('h-9 w-full border border-steel bg-ink px-3 text-sm text-[#e6e1da] placeholder:text-[#7d776f] focus-visible:outline-none focus-visible:border-copper', className)} {...props} />
));
Input.displayName = 'Input';
