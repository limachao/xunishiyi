import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 backdrop-blur-md',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/90 text-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_8px_20px_-10px_oklch(0.62_0.11_195_/_0.8)]',
        secondary:
          'border-white/10 bg-white/[0.08] text-foreground shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] hover:bg-white/[0.12]',
        destructive:
          'border-transparent bg-destructive/90 text-destructive-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_8px_20px_-10px_oklch(0.6_0.24_25_/_0.7)]',
        outline: 'text-foreground border-white/10 bg-transparent',
        success:
          'border-emerald-400/20 bg-emerald-500/15 text-emerald-300 shadow-[0_0_0_1px_rgba(52,211,153,0.18)_inset]',
        warning:
          'border-amber-400/20 bg-amber-500/15 text-amber-300 shadow-[0_0_0_1px_rgba(251,191,36,0.18)_inset]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
