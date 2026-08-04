import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export function ChartTakeaway({
  headline,
  className,
}: {
  headline: ReactNode;
  className?: string;
}) {
  if (!headline) return null;

  return (
    <div
      className={`mb-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-foreground backdrop-blur-sm ${
        className ?? ""
      }`}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="leading-snug">{headline}</div>
    </div>
  );
}
