import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-stone-text">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            "bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm placeholder:text-stone-text focus:outline-none focus:border-amber transition-colors",
            error && "border-red-700",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-stone-text">
            {label}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          className={cn(
            "bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm placeholder:text-stone-text focus:outline-none focus:border-amber transition-colors resize-none",
            error && "border-red-700",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-stone-text">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={cn(
            "bg-bg-elevated border border-stone-border rounded px-3 py-2 text-sm text-beige-warm focus:outline-none focus:border-amber transition-colors",
            error && "border-red-700",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
