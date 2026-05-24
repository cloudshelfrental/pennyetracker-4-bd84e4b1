import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MapPicker } from "@/components/map/MapPicker";
import { useGoogleMapsKey } from "@/hooks/use-google-maps-key";

export const Route = createFileRoute("/update-location/panchayath")({
  component: UpdatePanchayathLocation,
  head: () => ({ meta: [{ title: "Update Panchayath Location — Penny-eTracker" }] }),
});

function UpdatePanchayathLocation() {
  const apiKey = useGoogleMapsKey();
  const [districtId, setDistrictId] = useState<string | null>(null);

  const { data: districts = [] } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("districts")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/update-location">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Update Panchayath Location</h1>
      </div>

      <MapPicker
        kind="panchayath"
        apiKey={apiKey}
        parents={districts}
        parentId={districtId}
        onParentChange={setDistrictId}
        parentLabel="District"
      />
    </main>
  );
}
