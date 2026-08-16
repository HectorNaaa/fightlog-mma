"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  /** When true, closing (Escape, backdrop click, × button) asks for confirmation first. */
  confirmClose?: boolean;
  /** Message shown in the confirmation dialog when confirmClose is true. */
  confirmMessage?: string;
}

export function Modal({ open, onClose, title, children, className, confirmClose, confirmMessage }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const requestClose = () => {
    if (confirmClose && typeof window !== "undefined") {
      const ok = window.confirm(confirmMessage ?? "You have unsaved changes. Are you sure you want to leave?");
      if (!ok) return;
    }
    onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, confirmClose, confirmMessage]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) requestClose();
      }}
    >
      <div
        className={cn(
          "bg-bg-secondary border border-stone-border rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-border">
          <h2 className="font-condensed text-lg font-bold uppercase tracking-wider text-beige-surface">
            {title}
          </h2>
          <button
            onClick={requestClose}
            className="text-stone-text hover:text-beige-warm text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
