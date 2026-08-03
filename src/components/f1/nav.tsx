import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { F1LogoIcon, F1LogoFull } from "@/components/f1/f1-logo";

const links = [
  { to: "/season", label: "Season" },
  { to: "/races", label: "Races" },
  { to: "/circuits", label: "Circuits" },
  { to: "/drivers", label: "Drivers" },
  { to: "/news", label: "News" },
  { to: "/compare", label: "Compare" },
  { to: "/strategy", label: "Strategy" },
] as const;

export function TopNav() {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "oklch(0.12 0.004 255 / 0.92)",
        borderBottom: "1px solid oklch(1 0 0 / 6%)",
        backdropFilter: "blur(24px) saturate(140%)",
        boxShadow: "0 1px 0 0 oklch(0 0 0 / 40%)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-8 px-4 sm:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <F1LogoFull className="h-7 transition-transform duration-200 group-hover:scale-105" />
          <span
            className="font-display text-base font-black uppercase"
            style={{ letterSpacing: "0.1em" }}
          >
            f1<span style={{ color: "oklch(0.60 0.245 27)" }}>Bidda</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center md:flex" style={{ gap: "2px" }}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{
                style: {
                  color: "oklch(0.94 0.003 255)",
                  background: "oklch(1 0 0 / 5%)",
                  boxShadow: "inset 0 -2px 0 0 oklch(0.60 0.245 27)",
                },
              }}
              inactiveProps={{
                style: { color: "oklch(0.55 0.012 255)" },
              }}
              className="relative rounded-sm px-3 py-2 font-display text-sm font-semibold uppercase transition-all hover:text-foreground hover:bg-white/5"
              style={{ letterSpacing: "0.08em" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div
            className="flex items-center gap-2 px-3 py-1"
            style={{
              background: "oklch(0.60 0.245 27 / 0.1)",
              border: "1px solid oklch(0.60 0.245 27 / 0.25)",
              borderRadius: "0.25rem",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: "oklch(0.60 0.245 27)",
                boxShadow: "0 0 6px oklch(0.60 0.245 27)",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
            <span
              className="font-num text-[11px] font-medium"
              style={{ color: "oklch(0.60 0.245 27)" }}
            >
              LIVE · S2026
            </span>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto md:hidden rounded p-1.5 text-foreground hover:bg-white/5"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="md:hidden px-4 py-3"
          style={{
            borderTop: "1px solid oklch(1 0 0 / 6%)",
            background: "oklch(0.12 0.004 255 / 0.98)",
          }}
        >
          <nav className="flex flex-col">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                activeProps={{
                  style: {
                    color: "oklch(0.94 0.003 255)",
                    borderLeftColor: "oklch(0.60 0.245 27)",
                  },
                }}
                inactiveProps={{
                  style: { color: "oklch(0.55 0.012 255)" },
                }}
                className="border-l-2 border-transparent py-2.5 pl-4 font-display text-sm font-semibold uppercase transition-colors hover:text-foreground"
                style={{ letterSpacing: "0.08em" }}
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
