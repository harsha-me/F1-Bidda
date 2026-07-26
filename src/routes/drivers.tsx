import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eyebrow, SectionHeader } from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import { driverStandingsQuery, sessionDriversQuery } from "@/lib/f1-queries";
import { CURRENT_SEASON, type Driver } from "@/lib/f1-data";

export const Route = createFileRoute("/drivers")({
  head: () => ({
    meta: [
      { title: "Drivers · f1Bidda" },
      {
        name: "description",
        content:
          "Every driver on the current Formula 1 grid — cars, numbers, teams and their road from karting to F1.",
      },
      { property: "og:title", content: "Drivers · f1Bidda" },
      {
        property: "og:description",
        content: "Grid, bios and the road to F1 for every current driver.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DriversLayout,
});

// Layout wrapper: shows the grid on /drivers exactly,
// renders child route (detail page) on /drivers/$driverId
function DriversLayout() {
  const matches = useRouterState({ select: (s) => s.matches });
  // If the last match is /drivers (no child), show the grid
  const isIndex = matches[matches.length - 1]?.routeId === "/drivers";

  if (isIndex) {
    return <DriversPage />;
  }

  // Render child route (driver detail page)
  return <Outlet />;
}

function DriversPage() {
  const standingsQ = useQuery(driverStandingsQuery(CURRENT_SEASON));
  const of1Q = useQuery(sessionDriversQuery("latest"));

  const drivers = useMemo(() => standingsQ.data?.map((r) => r.driver) ?? [], [standingsQ.data]);

  const headshotByCode = useMemo(() => {
    const m = new Map<string, string>();
    (of1Q.data ?? []).forEach((d: any) => {
      if (d.name_acronym && d.headshot_url) m.set(d.name_acronym, d.headshot_url as string);
    });
    return m;
  }, [of1Q.data]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <SectionHeader eyebrow="Grid" title={`${CURRENT_SEASON} Drivers`} />

      {standingsQ.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : standingsQ.isError ? (
        <ErrorNote
          message="Driver list is temporarily unavailable."
          onRetry={() => standingsQ.refetch()}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {drivers.map((d) => (
            <DriverCard key={d.code} driver={d} photo={headshotByCode.get(d.code)} />
          ))}
        </div>
      )}
    </div>
  );
}

function DriverCard({ driver, photo }: { driver: Driver; photo?: string }) {
  const id = driver.driverId ?? driver.code.toLowerCase();
  return (
    <Link
      to="/drivers/$driverId"
      params={{ driverId: id }}
      className="glass-card glass-card-hover group flex flex-col gap-3 p-4"
    >
      <div
        className="relative aspect-square w-full overflow-hidden rounded-xl"
        style={{
          background: `linear-gradient(160deg, ${driver.teamColor}55, rgba(10,10,11,0.9))`,
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={driver.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-display text-5xl font-black text-white/70">{driver.code}</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 rounded-md bg-background/70 px-2 py-0.5 font-num text-xs font-bold text-white backdrop-blur-md">
          #{driver.number}
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: driver.teamColor }}
        />
      </div>
      <div>
        <Eyebrow>{driver.team}</Eyebrow>
        <div className="mt-1 font-display text-lg font-bold uppercase leading-tight tracking-wide">
          {driver.name}
        </div>
      </div>
    </Link>
  );
}
