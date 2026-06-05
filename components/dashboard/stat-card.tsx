import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  accent?: "burgundy" | "amber" | "navy" | "default";
  className?: string;
}

export function StatCard({ label, value, unit, delta, accent = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-bg-card border border-stone-border rounded-sm p-4 flex flex-col gap-2",
        className
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-text">{label}</div>
      <div className="flex items-end gap-1.5">
        <span
          className={cn(
            "font-condensed font-black text-3xl leading-none tabular-nums",
            accent === "burgundy" && "text-burgundy-light",
            accent === "amber" && "text-amber",
            accent === "navy" && "text-navy-light",
            accent === "default" && "text-beige-surface"
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs text-stone-text mb-0.5">{unit}</span>
        )}
      </div>
      {delta && (
        <div className="text-[11px] text-stone-text">{delta}</div>
      )}
    </div>
  );
}
