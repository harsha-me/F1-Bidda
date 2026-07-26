import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function CountdownTimer({ target }: { target: string }) {
  const t = new Date(target).getTime();
  const [v, setV] = useState(() => diff(t));
  useEffect(() => {
    const id = setInterval(() => setV(diff(t)), 1000);
    return () => clearInterval(id);
  }, [t]);
  const units: [string, number][] = [
    ["DAYS", v.d],
    ["HRS", v.h],
    ["MIN", v.m],
    ["SEC", v.s],
  ];
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {units.map(([l, n]) => (
        <div
          key={l}
          className="glass-card flex flex-col items-center justify-center py-4 px-2 sm:px-4"
        >
          <span className="font-display text-3xl font-bold tabular-nums sm:text-5xl">
            {String(n).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}
