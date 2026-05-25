import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LeafletMap, type LeafletMarker } from "@/components/map/LeafletMap";

export const Route = createFileRoute("/marking/")({
  component: MarkingView,
  head: () => ({ meta: [{ title: "Marking — Pinned Locations" }] }),
});

function MarkingView() {
  const [show, setShow] = useState<{ panchayath: boolean; ward: boolean }>({
    panchayath: true,
    ward: true,
  });

  const { data: panchayaths = [] } = useQuery({
    queryKey: ["marking", "panchayaths-pinned"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("panchayaths")
        .select("id, name, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: wards = [] } = useQuery({
    queryKey: ["marking", "wards-pinned"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wards")
        .select("id, name, ward_number, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const markers: LeafletMarker[] = useMemo(() => {
    const m: LeafletMarker[] = [];
    if (show.panchayath) {
      for (const p of panchayaths) {
        m.push({ id: `p-${p.id}`, name: p.name, lat: p.latitude!, lng: p.longitude! });
      }
    }
    if (show.ward) {
      for (const w of wards) {
        m.push({
          id: `w-${w.id}`,
          name: w.name,
          lat: w.latitude!,
          lng: w.longitude!,
          label: w.ward_number ?? null,
        });
      }
    }
    return m;
  }, [panchayaths, wards, show]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pinned Locations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only view of saved panchayath and ward locations.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={show.panchayath}
              onChange={(e) => setShow((s) => ({ ...s, panchayath: e.target.checked }))}
            />
            Panchayaths ({panchayaths.length})
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={show.ward}
              onChange={(e) => setShow((s) => ({ ...s, ward: e.target.checked }))}
            />
            Wards ({wards.length})
          </label>
        </div>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <LeafletMap markers={markers} height="75vh" fitToMarkers />
        </CardContent>
      </Card>
    </main>
  );
}
