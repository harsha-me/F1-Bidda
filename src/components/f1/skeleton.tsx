import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} aria-hidden />;
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glass-card flex flex-col items-start gap-2 border-primary/30 p-5 text-sm">
      <div className="label-eyebrow text-primary">Data unavailable</div>
      <div className="text-muted-foreground">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest hover:bg-white/10"
        >
          Retry
        </button>
      )}
    </div>
  );
}
