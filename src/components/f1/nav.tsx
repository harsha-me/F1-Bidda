import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";

const links = [
  { to: "/season", label: "Season" },
  { to: "/races", label: "Races" },
  { to: "/circuits", label: "Circuits" },
  { to: "/drivers", label: "Drivers" },
  { to: "/compare", label: "Compare" },
  { to: "/strategy", label: "Strategy" },
] as const;

export function TopNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-red">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold uppercase tracking-widest">
            f1Bidda<span className="text-primary">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-foreground bg-white/5" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium uppercase tracking-wide font-display transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-num text-xs text-muted-foreground">SEASON 2026</span>
          </div>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto md:hidden rounded-lg p-2 text-foreground hover:bg-white/5"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl px-4 py-4">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium uppercase tracking-wide font-display text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
