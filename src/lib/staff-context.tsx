import { createContext, useContext, type ReactNode } from "react";

export type StaffProfile = {
  roles: string[];
  name: string | null;
  email: string | null;
  userId: string;
};

const StaffContext = createContext<StaffProfile | null>(null);

export function StaffProvider({ value, children }: { value: StaffProfile; children: ReactNode }) {
  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaffProfile() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaffProfile deve ser usado dentro da area autenticada.");
  return ctx;
}
