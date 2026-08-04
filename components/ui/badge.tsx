import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  "General Training": "bg-burgundy/20 text-burgundy-light border-burgundy/30",
  Boxing: "bg-amber/20 text-amber-light border-amber/30",
  "Muay Thai": "bg-burgundy-dark/25 text-burgundy-light border-burgundy-dark/40",
  Wrestling: "bg-navy/40 text-beige-surface border-navy/50",
  BJJ: "bg-stone-muted/30 text-beige-light border-stone-muted/40",
  Grappling: "bg-beige-dark/20 text-beige-dark border-beige-dark/30",
  Strength: "bg-stone-muted/30 text-beige-light border-stone-muted/40",
  Conditioning: "bg-burgundy/10 text-burgundy-light border-burgundy/20",
  Mobility: "bg-beige/20 text-beige-dark border-beige/30",
  Recovery: "bg-navy/25 text-beige-surface border-navy/35",
};

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className }: BadgeProps) {
  const colorClass = typeColors[label] ?? "bg-stone-muted/30 text-beige-light border-stone-muted/40";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wide border rounded-sm",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}

interface RatingDotsProps {
  value: number;
  max?: number;
}

export function RatingDots({ value, max = 10 }: RatingDotsProps) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            i < value ? "bg-amber" : "bg-stone-border"
          )}
        />
      ))}
    </div>
  );
}
