import { cn } from "@/lib/utils";
import type React from "react";
import type { ReactNode } from "react";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { Driver } from "@/lib/f1-data";
import { COMPOUND_COLOR, COMPOUND_LETTER, type LapRecord } from "@/lib/f1-data";

export function GlassCard({
  children,
  className,
  hover,
  onClick,
  style,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("glass-card", hover && "glass-card-hover", className)}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

export function PitPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("pit-panel", className)}>{children}</div>;
}

export function Eyebrow({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("label-eyebrow", className)} style={style}>
      {children}
    </div>
  );
}

export function EyebrowRed({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("label-eyebrow-red", className)} style={style}>
      {children}
    </div>
  );
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
      ? "oklch(0.60 0.245 27)"
      : accent === "teal"
        ? "oklch(0.76 0.14 190)"
        : accent === "pink"
          ? "oklch(0.70 0.18 350)"
          : accent === "amber"
            ? "oklch(0.80 0.18 75)"
            : accent === "blue"
              ? "oklch(0.62 0.20 250)"
              : "oklch(0.94 0.003 255)";

  return (
    <div
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderTop: `2px solid ${accentColor}`,
        borderRadius: "0.5rem",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        transition: "box-shadow 180ms ease",
      }}
    >
      <div className="label-eyebrow">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="stat-value" style={{ color: accentColor }}>
          {value}
        </span>
        {suffix && (
          <span className="text-sm" style={{ color: "oklch(0.55 0.012 255)" }}>
            {suffix}
          </span>
        )}
      </div>
      {delta !== undefined && <DeltaChip delta={delta} />}
    </div>
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
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-num font-semibold"
      style={{
        background: up ? "oklch(0.73 0.18 155 / 0.12)" : "oklch(0.60 0.245 27 / 0.12)",
        color: up ? "oklch(0.73 0.18 155)" : "oklch(0.60 0.245 27)",
      }}
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
  const sz =
    size === "sm" ? "h-6 w-6 text-[10px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div
        className={cn(
          "grid shrink-0 place-items-center font-display font-black tracking-wider text-black",
          sz,
        )}
        style={{
          backgroundColor: driver.teamColor,
          clipPath: size === "lg" ? "polygon(0 0, 100% 0, 100% 80%, 90% 100%, 0 100%)" : undefined,
          borderRadius: size === "lg" ? 0 : "0.25rem",
        }}
      >
        {driver.code}
      </div>
      {showName && (
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{driver.name}</div>
          <div className="truncate text-xs" style={{ color: "oklch(0.55 0.012 255)" }}>
            {driver.team}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompoundBadge({ compound }: { compound: NonNullable<LapRecord["compound"]> }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center text-[10px] font-bold font-num"
      style={{
        color: COMPOUND_COLOR[compound],
        border: `1px solid ${COMPOUND_COLOR[compound]}`,
        borderRadius: "50%",
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
    <div className="mb-7 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2.5 flex items-center gap-2">
            <span
              className="block h-3 w-0.5 rounded-full"
              style={{ background: "oklch(0.60 0.245 27)" }}
            />
            <span className="label-eyebrow-red">{eyebrow}</span>
          </div>
        )}
        <h2
          className="font-display font-black uppercase tracking-tight"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: 1.05 }}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}
