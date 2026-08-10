import { db, productos } from "@/db";
import { desc } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { requireAcceso } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { TiendaManager } from "@/components/tienda-manager";
import { mercadopagoConfigurado } from "@/lib/mercadopago";

export default async function TiendaPage() {
  await requireAcceso("tienda");
  const items = await db.select().from(productos).orderBy(desc(productos.id));
  const mpOk = mercadopagoConfigurado();
  return (
    <>
      <PageHeader
        title="Tienda online sincronizada"
        subtitle="El stock se actualiza en tiempo real. Publicá y generá contenido con IA."
        action={
          <a href="/store" target="_blank" rel="noopener noreferrer" className="btn-ghost">
            <ExternalLink className="h-4 w-4" /> Ver tienda pública
          </a>
        }
      />

      <div
        className={`card mb-6 p-3 text-sm ${
          mpOk
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        {mpOk
          ? "MercadoPago configurado · los pagos online de la tienda pública están activos."
          : "MercadoPago sin configurar · definí MP_ACCESS_TOKEN en el entorno para activar los cobros online."}
      </div>

      <TiendaManager items={items} />
    </>
  );
}
