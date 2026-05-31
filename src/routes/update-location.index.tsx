import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPinned, Grid3x3, ChevronRight, ArrowLeft, Package } from "lucide-react";

export const Route = createFileRoute("/update-location/")({
  component: UpdateLocationHub,
  head: () => ({
    meta: [
      { title: "Update Location — Penny-eTracker" },
      {
        name: "description",
        content: "Update GPS location for panchayaths, wards, and pickup points using map pin or device GPS.",
      },
    ],
  }),
});

const items = [
  {
    to: "/update-location/panchayath" as const,
    title: "Panchayath Location",
    desc: "Select a panchayath and pin its location on the map or use GPS.",
    icon: MapPinned,
    gradient: "from-[oklch(0.55_0.2_260)] to-[oklch(0.65_0.22_290)]",
  },
  {
    to: "/update-location/ward" as const,
    title: "Ward Location",
    desc: "Pick a panchayath, choose a ward, then capture its GPS location.",
    icon: Grid3x3,
    gradient: "from-[oklch(0.6_0.2_30)] to-[oklch(0.7_0.2_60)]",
  },
  {
    to: "/update-location/pickup-point" as const,
    title: "Pickup Points",
    desc: "Add and pin multiple pickup points under each panchayath.",
    icon: Package,
    gradient: "from-[oklch(0.55_0.2_150)] to-[oklch(0.65_0.2_180)]",
  },
];

function UpdateLocationHub() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/landing">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Update Location</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set or update the GPS coordinates for a panchayath or ward.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map(({ to, title, desc, icon: Icon, gradient }) => (
          <Link key={to} to={to}>
            <Card
              className={`group relative h-44 overflow-hidden border-0 bg-gradient-to-br ${gradient} p-6 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(1_0_0/0.25),transparent_60%)]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                    {title}
                    <ChevronRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </h2>
                  <p className="mt-1 text-sm text-white/80">{desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
