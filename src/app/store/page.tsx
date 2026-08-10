import { db, productos } from "@/db";
import { and, eq, gt, asc } from "drizzle-orm";
import { mercadopagoConfigurado } from "@/lib/mercadopago";
import { StoreCarrito } from "./StoreCarrito";

// La tienda pública lista solo productos publicados y con stock.
export default async function StorePage() {
  const items = await db
    .select()
    .from(productos)
    .where(and(eq(productos.publicado, true), gt(productos.stock, 0)))
    .orderBy(asc(productos.nombre));

  const disponible = mercadopagoConfigurado();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Catálogo</h1>
        <p className="mt-1 text-sm text-slate-500">Elegí tus productos y pagá con MercadoPago.</p>
      </div>

      {!disponible && (
        <div className="card mb-5 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Los pagos online no están disponibles en este momento. Volvé a intentar más tarde.
        </div>
      )}

      {items.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-400">
          No hay productos disponibles por el momento.
        </div>
      ) : (
        <StoreCarrito productos={items} disponible={disponible} />
      )}
    </>
  );
}
