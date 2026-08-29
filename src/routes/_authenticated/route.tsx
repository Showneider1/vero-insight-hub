import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { createContext, useContext, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { getStaffProfile } from "@/lib/admin.functions";

export type StaffProfile = {
  roles: string[];
  name: string | null;
  email: string | null;
  userId: string;
};

const StaffContext = createContext<StaffProfile | null>(null);

export function useStaffProfile() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaffProfile deve ser usado dentro da area autenticada.");
  return ctx;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedGate,
});

type GateState = { status: "loading" } | { status: "ready"; profile: StaffProfile } | { status: "denied" };

function AuthenticatedGate() {
  const navigate = useNavigate();
  const getProfile = useServerFn(getStaffProfile);
  const [state, setState] = useState<GateState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    getProfile()
      .then((profile) => {
        if (active) setState({ status: "ready", profile });
      })
      .catch(() => {
        if (active) setState({ status: "denied" });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.status === "denied") {
      navigate({ to: "/auth" });
    }
  }, [state.status, navigate]);

  if (state.status !== "ready") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Verificando acesso…
        </div>
      </div>
    );
  }

  return (
    <StaffContext.Provider value={state.profile}>
      <Outlet />
    </StaffContext.Provider>
  );
}
