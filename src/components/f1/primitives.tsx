import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { Driver } from "@/lib/f1-data";
import { COMPOUND_COLOR, COMPOUND_LETTER, type LapRecord } from "@/lib/f1-data";

export function GlassCard({
  children,
  className,
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn("glass-card p-5", hover && "glass-card-hover", className)}>{children}</div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("label-eyebrow", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  delta,
  suffix,
  accent,
}: {
  label: string;
  value: string | number;
  delta?: number;
  suffix?: string;
  accent?: "red" | "teal" | "pink" | "amber" | "blue";
}) {
  const accentColor =
    accent === "red"
      ? "text-primary"
      : accent === "teal"
        ? "text-teal"
        : accent === "pink"
          ? "text-pink"
          : accent === "amber"
            ? "text-amber"
            : accent === "blue"
              ? "text-blue"
              : "text-foreground";

  return (
    <GlassCard hover className="flex flex-col gap-3">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex items-baseline gap-2">
        <span className={cn("stat-value", accentColor)}>{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {delta !== undefined && <DeltaChip delta={delta} />}
    </GlassCard>
  );
}

export function DeltaChip({ delta }: { delta: number }) {
  if (delta === 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-num">
        <Minus className="h-3 w-3" /> 0
      </span>
    );
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-num",
        up ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
      )}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta)}
    </span>
  );
}

export function DriverChip({
  driver,
  size = "md",
  showName = true,
}: {
  driver: Driver;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}) {
  const dot =
    size === "sm" ? "h-6 w-6 text-[10px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-md font-display font-bold tracking-wider text-black",
          dot,
        )}
        style={{ backgroundColor: driver.teamColor }}
      >
        {driver.code}
      </div>
      {showName && (
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{driver.name}</div>
          <div className="truncate text-xs text-muted-foreground">{driver.team}</div>
        </div>
      )}
    </div>
  );
}

export function CompoundBadge({ compound }: { compound: NonNullable<LapRecord["compound"]> }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold font-num"
      style={{
        color: COMPOUND_COLOR[compound],
        borderColor: COMPOUND_COLOR[compound],
      }}
      title={compound}
    >
      {COMPOUND_LETTER[compound]}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}
