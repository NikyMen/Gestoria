import { db, productos } from "@/db";
import { desc } from "drizzle-orm";
import { requireAcceso } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { TiendaManager } from "@/components/tienda-manager";

export default async function TiendaPage() {
  await requireAcceso("tienda");
  const items = await db.select().from(productos).orderBy(desc(productos.id));
  return (
    <>
      <PageHeader
        title="Tienda online sincronizada"
        subtitle="El stock se actualiza en tiempo real. Publicá y generá contenido con IA."
      />
      <TiendaManager items={items} />
    </>
  );
}
