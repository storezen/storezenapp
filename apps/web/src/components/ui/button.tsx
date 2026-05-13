"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center rounded-xl font-bold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-zinc-900 text-white shadow-lg shadow-zinc-900/15 hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-900/20 hover:-translate-y-px active:translate-y-0",
        secondary:
          "border-2 border-zinc-200 bg-white text-zinc-900 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:-translate-y-px hover:shadow-md active:translate-y-0",
        ghost:
          "bg-transparent text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200",
        outline:
          "border-2 border-zinc-900 bg-transparent text-zinc-900 hover:bg-zinc-900 hover:text-white active:scale-[0.97]",
        accent:
          "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-px active:translate-y-0",
        "accent-outline":
          "border-2 border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50 hover:border-emerald-700 active:scale-[0.97]",
        destructive:
          "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500 hover:shadow-xl hover:shadow-red-500/25 active:scale-[0.97]",
        whatsapp:
          "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-600/25 hover:-translate-y-px active:translate-y-0",
        link: "text-emerald-600 underline-offset-4 hover:underline hover:text-emerald-700",
      },
      size: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-3.5 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-[15px]",
        xl: "h-14 px-8 text-base",
        "2xl": "h-16 px-10 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        dense: "h-9 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", loading, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>{children}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {children}
          </span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };