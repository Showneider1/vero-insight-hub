import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { GitCompare, KeyRound, LayoutDashboard, LogOut, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pill, VeroLogo } from "@/components/vero/brand";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useStaffProfile } from "../route";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/candidatos", label: "Candidatos", icon: Users, exact: false },
  { to: "/admin/comparar", label: "Comparar", icon: GitCompare, exact: false },
  { to: "/admin/codigos", label: "Codigos", icon: KeyRound, exact: false },
];

function AdminLayout() {
  const navigate = useNavigate();
  const profile = useStaffProfile();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const isAdmin = profile.roles.includes("admin");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <VeroLogo />
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">{profile.name ?? profile.email}</p>
              <Pill tone={isAdmin ? "info" : "muted"} className="mt-0.5">
                {isAdmin ? "Administrador" : "Recrutador"}
              </Pill>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1.5 size-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
