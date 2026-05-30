import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ShieldCheck, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/admins")({
  component: AdminsPage,
  head: () => ({ meta: [{ title: "Admins — Penny-eTracker" }] }),
});

type Role = "super_admin" | "admin" | "delivery";

function AdminsPage() {
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", password: "" });

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["admins-list"],
    queryFn: async () => {
      const [{ data: ps }, { data: rs }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const merged = (ps ?? []).map((p) => ({
        ...p,
        roles: (rs ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as Role),
      }));
      return merged.filter((p) => p.roles.includes("admin") || p.roles.includes("super_admin"));
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-admin-user", {
        body: { ...form, role: "admin" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast.success("Admin created");
      setForm({ full_name: "", phone: "", password: "" });
      qc.invalidateQueries({ queryKey: ["admins-list"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create admin"),
  });

  const promote = useMutation({
    mutationFn: async ({ userId, to }: { userId: string; to: "super_admin" | "admin" }) => {
      const other: Role = to === "admin" ? "super_admin" : "admin";
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", other);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: to });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admins-list"] });
      toast.success("Role updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .in("role", ["admin", "super_admin"]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admins-list"] });
      toast.success("Admin access revoked");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admins</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage administrator accounts and super admin privileges.
          </p>
        </div>
      </div>

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add new admin</CardTitle>
            <CardDescription>Create an admin account with mobile number and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 md:grid-cols-4"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  required
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile (with country code)</Label>
                <Input
                  id="phone"
                  placeholder="+919876543210"
                  value={form.phone}
                  required
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={6}
                  value={form.password}
                  required
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={create.isPending}>
                  {create.isPending ? "Creating…" : "Add admin"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone / Email</TableHead>
              <TableHead>Role</TableHead>
              {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && admins.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No admins yet.
                </TableCell>
              </TableRow>
            )}
            {admins.map((a) => {
              const isSuper = a.roles.includes("super_admin");
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.full_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.phone ?? a.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={isSuper ? "default" : "secondary"}>
                      {isSuper ? "Super Admin" : "Admin"}
                    </Badge>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={promote.isPending}
                          onClick={() =>
                            promote.mutate({ userId: a.id, to: isSuper ? "admin" : "super_admin" })
                          }
                        >
                          {isSuper ? "Demote to Admin" : "Make Super Admin"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={revoke.isPending}
                          onClick={() => {
                            if (confirm(`Revoke admin access for ${a.full_name ?? a.phone}?`)) {
                              revoke.mutate(a.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}