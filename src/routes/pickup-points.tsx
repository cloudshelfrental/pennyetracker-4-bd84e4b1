import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, MapPin, Phone, Home, ChevronDown, Navigation } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pickup-points")({
  component: PickupPointsPage,
  head: () => ({
    meta: [
      { title: "Pickup Points — Penny-eTracker" },
      { name: "description", content: "Browse parcel pickup points by panchayath with address and contact." },
    ],
  }),
});

type Point = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
};
type Group = {
  panchayath_id: string;
  panchayath_name: string;
  points: Point[];
};

const PALETTE = [
  { chip: "bg-emerald-600", card: "bg-emerald-50", icon: "text-emerald-600" },
  { chip: "bg-blue-600", card: "bg-blue-50", icon: "text-blue-600" },
  { chip: "bg-orange-500", card: "bg-orange-50", icon: "text-orange-500" },
  { chip: "bg-violet-600", card: "bg-violet-50", icon: "text-violet-600" },
  { chip: "bg-pink-600", card: "bg-pink-50", icon: "text-pink-600" },
  { chip: "bg-teal-600", card: "bg-teal-50", icon: "text-teal-600" },
  { chip: "bg-amber-700", card: "bg-amber-50", icon: "text-amber-700" },
  { chip: "bg-indigo-600", card: "bg-indigo-50", icon: "text-indigo-600" },
];

type ColorSet = { chip: string; card: string; icon: string };

function PointCard({ point, colors }: { point: Point; colors: ColorSet }) {
  const [open, setOpen] = useState(false);
  const hasGeo = point.latitude != null && point.longitude != null;
  return (
    <div className="rounded-lg bg-white/80 shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Package className={`h-4 w-4 shrink-0 ${colors.icon}`} />
          <span className="font-medium truncate">{point.name}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${colors.icon}`} />
      </button>
      {open && (
        <div className="border-t px-3 py-2 space-y-1">
          {point.phone && (
            <a href={`tel:${point.phone}`} className="flex items-center gap-2 text-sm hover:underline">
              <Phone className={`h-4 w-4 ${colors.icon}`} />
              <span>{point.phone}</span>
            </a>
          )}
          {point.address && (
            <div className="flex items-start gap-2 text-sm">
              <Home className={`mt-0.5 h-4 w-4 shrink-0 ${colors.icon}`} />
              <span>{point.address}</span>
            </div>
          )}
          {hasGeo && (
            <a
              href={`https://www.google.com/maps?q=${point.latitude},${point.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <Navigation className={`h-4 w-4 ${colors.icon}`} />
              <span>Open in Maps</span>
            </a>
          )}
          {!point.phone && !point.address && !hasGeo && (
            <p className="text-xs text-muted-foreground">No additional details.</p>
          )}
        </div>
      )}
    </div>
  );
}

function PickupPointsPage() {
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ["public-pickup-points"],
    queryFn: async (): Promise<Group[]> => {
      const { data, error } = await (supabase as any).rpc("get_public_pickup_points");
      if (error) throw error;
      return (data as Group[] | null) ?? [];
    },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-12">
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <div className="flex items-center gap-3 rounded-xl bg-[oklch(0.25_0.08_260)] px-5 py-4 text-white shadow-md">
          <div className="rounded-lg bg-white/15 p-2">
            <Package className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Pickup Points Directory</h1>
        </div>

        {isLoading && <p className="mt-8 text-center text-muted-foreground">Loading…</p>}
        {error && (
          <p className="mt-8 text-center text-destructive">Failed to load: {(error as Error).message}</p>
        )}
        {!isLoading && !error && groups.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground">No pickup points yet.</p>
        )}

        <div className="mt-6 space-y-6">
          {groups.map((g, gi) => {
            const c = PALETTE[gi % PALETTE.length];
            return (
              <section key={g.panchayath_id}>
                <div className="flex justify-center">
                  <div className={`inline-flex items-center gap-1.5 rounded-md ${c.chip} px-4 py-1.5 text-sm font-semibold text-white shadow`}>
                    <MapPin className="h-4 w-4" />
                    {g.panchayath_name}
                  </div>
                </div>

                <div className={`mt-2 grid gap-2 rounded-xl ${c.card} p-3 sm:grid-cols-2 lg:grid-cols-3`}>
                  {g.points.map((p) => (
                    <PointCard key={p.id} point={p} colors={c} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
