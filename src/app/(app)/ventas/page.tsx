import { recientes } from "@/lib/queries";
import { requireAcceso } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { VentasTabla } from "@/components/ventas-tabla";
import { money } from "@/lib/format";

export default async function VentasPage() {
  await requireAcceso("ventas");
  const ventas = await recientes.ventas();
  const total = ventas.reduce((a, v) => a + (v.estado !== "cancelada" ? v.total : 0), 0);
  return (
    <>
      <PageHeader title="Ventas" subtitle={`${ventas.length} operaciones · ${money(total)} facturado`} />
      <VentasTabla ventas={ventas} />
    </>
  );
}
