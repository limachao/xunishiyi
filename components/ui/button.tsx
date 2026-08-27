import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden rounded-2xl text-[15px] font-medium tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.985]',
  {
    variants: {
      variant: {
        default:
          'bg-[oklch(0.62_0.11_195_/_0.16)] text-white border border-white/15 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_30px_-12px_oklch(0.62_0.11_195_/_0.5)] hover:bg-[oklch(0.62_0.11_195_/_0.24)] hover:border-white/25 hover:shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_14px_36px_-12px_oklch(0.62_0.11_195_/_0.6)]',
        destructive:
          'bg-[oklch(0.6_0.24_25_/_0.18)] text-white border border-white/15 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_30px_-12px_oklch(0.6_0.24_25_/_0.5)] hover:bg-[oklch(0.6_0.24_25_/_0.28)]',
        outline:
          'border border-white/12 bg-white/[0.04] text-foreground backdrop-blur-xl hover:bg-white/[0.09] hover:border-white/18 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset]',
        secondary:
          'bg-white/[0.06] text-foreground border border-white/10 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] hover:bg-white/[0.11] hover:border-white/16',
        ghost:
          'text-foreground hover:bg-white/[0.08] hover:text-primary',
        link: 'text-primary underline-offset-4 hover:underline',
        glass:
          'glass text-foreground hover:bg-white/[0.14]',
      },
      size: {
        default: 'h-12 px-6 [&_svg]:size-5',
        sm: 'h-10 rounded-xl px-4 text-sm [&_svg]:size-4',
        lg: 'h-14 rounded-[1.35rem] px-8 text-base [&_svg]:size-[22px]',
        icon: 'h-11 w-11 rounded-2xl [&_svg]:size-[22px]',
        'icon-sm': 'h-9 w-9 rounded-xl [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
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
        className={cn(
          buttonVariants({ variant, size }),
          variant !== 'ghost' && variant !== 'link' &&
            'before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.18] before:to-white/[0.01] before:pointer-events-none',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
