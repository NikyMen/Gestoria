import type { ReactNode } from "react";
import { TiendaStoreShell } from "@/components/tienda/StoreShell";

export default function TiendaLayout({ children }: { children: ReactNode }) {
  return <TiendaStoreShell>{children}</TiendaStoreShell>;
}
