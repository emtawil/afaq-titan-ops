import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = D.Root;
export const DialogTitle = D.Title;
export const DialogDescription = D.Description;
export function DialogContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof D.Content>) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <D.Content dir="rtl" className={cn('fixed left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2 border border-copper/70 bg-charcoal shadow-2xl data-[state=open]:animate-pop-in', className)} {...props}>
        {children}
        <D.Close className="absolute left-3 top-3 text-[#b9b2a8] hover:text-copper" aria-label="إغلاق"><X size={20} /></D.Close>
      </D.Content>
    </D.Portal>
  );
}
