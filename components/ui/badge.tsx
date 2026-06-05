import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  MMA: "bg-burgundy/20 text-burgundy-light border-burgundy/30",
  Boxing: "bg-amber/20 text-amber-light border-amber/30",
  "Muay Thai": "bg-orange-900/20 text-orange-400 border-orange-900/30",
  Wrestling: "bg-navy/30 text-navy-light border-navy/40",
  BJJ: "bg-blue-900/20 text-blue-400 border-blue-900/30",
  Grappling: "bg-teal-900/20 text-teal-400 border-teal-900/30",
  Strength: "bg-stone-muted/30 text-beige-light border-stone-muted/40",
  Conditioning: "bg-green-900/20 text-green-400 border-green-900/30",
  Mobility: "bg-purple-900/20 text-purple-400 border-purple-900/30",
  Recovery: "bg-indigo-900/20 text-indigo-400 border-indigo-900/30",
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
