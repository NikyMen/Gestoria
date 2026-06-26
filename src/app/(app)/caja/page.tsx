import { db, productos } from "@/db";
import { asc } from "drizzle-orm";
import { requireAcceso } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CajaPOS } from "@/components/caja-pos";

export default async function CajaPage() {
  await requireAcceso("caja");
  const items = await db.select().from(productos).orderBy(asc(productos.nombre));
  return (
    <>
      <PageHeader title="Caja" subtitle="Punto de venta rápido · buscá o escaneá productos y cerrá el pedido" />
      <CajaPOS productos={items} />
    </>
  );
}
