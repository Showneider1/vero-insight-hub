import { cn } from "@/lib/utils";

export function VeroLogo({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "light";
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl font-display text-base font-bold",
          variant === "light" ? "bg-navy-foreground/15 text-navy-foreground" : "gradient-primary text-primary-foreground",
        )}
      >
        V
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-sm font-bold tracking-tight",
            variant === "light" ? "text-navy-foreground" : "text-foreground",
          )}
        >
          Vero
        </span>
        <span
          className={cn(
            "block text-[11px] font-medium uppercase tracking-[0.16em]",
            variant === "light" ? "text-navy-foreground/60" : "text-muted-foreground",
          )}
        >
          Talent Assessment
        </span>
      </span>
    </div>
  );
}

const TONES = {
  muted: "bg-muted text-muted-foreground border-border",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  info: "bg-info/12 text-info border-info/30",
  success: "bg-success/12 text-success border-success/30",
  danger: "bg-destructive/12 text-destructive border-destructive/30",
} as const;

export function Pill({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ScorePill({ value, label }: { value: number | null | undefined; label?: string }) {
  if (value === null || value === undefined) {
    return <Pill tone="muted">{label ? `${label} —` : "—"}</Pill>;
  }
  const tone = value >= 8 ? "success" : value >= 6.5 ? "info" : value >= 5 ? "warning" : "danger";
  return (
    <Pill tone={tone}>
      {label ? `${label} ` : ""}
      {value.toFixed(1)}
    </Pill>
  );
}
