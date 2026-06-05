"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded",
          {
            "bg-burgundy text-beige-surface hover:bg-burgundy-light active:bg-burgundy-dark":
              variant === "primary",
            "bg-bg-elevated text-beige-warm border border-stone-border hover:border-stone-muted hover:bg-stone-border":
              variant === "secondary",
            "text-beige-warm hover:text-beige-surface hover:bg-bg-elevated":
              variant === "ghost",
            "bg-red-900/40 text-red-300 border border-red-900 hover:bg-red-900/60":
              variant === "danger",
            "border border-burgundy text-burgundy hover:bg-burgundy/10":
              variant === "outline",
          },
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
