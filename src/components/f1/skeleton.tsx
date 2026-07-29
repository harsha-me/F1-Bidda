import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded", className)}
      aria-hidden
      style={{
        background:
          "linear-gradient(90deg, oklch(1 0 0 / 4%) 25%, oklch(1 0 0 / 7%) 50%, oklch(1 0 0 / 4%) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.8s ease-in-out infinite",
      }}
    />
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      style={{
        background: "oklch(0.60 0.245 27 / 0.07)",
        border: "1px solid oklch(0.60 0.245 27 / 0.25)",
        borderLeft: "3px solid oklch(0.60 0.245 27)",
        borderRadius: "0.5rem",
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <div className="label-eyebrow-red">Data unavailable</div>
      <div className="text-sm" style={{ color: "oklch(0.65 0.01 255)" }}>
        {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase transition-opacity hover:opacity-80"
          style={{
            color: "oklch(0.60 0.245 27)",
            letterSpacing: "0.08em",
          }}
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      )}
    </div>
  );
}
