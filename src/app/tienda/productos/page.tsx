import { listTiendaProductos } from "@/lib/tienda";
import { TiendaProductGrid } from "@/components/tienda/StoreShell";

export const dynamic = "force-dynamic";

export default async function TiendaProductosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const products = await listTiendaProductos({ search: q });
  return <div className="space-y-5 px-4 py-6 md:px-6 md:py-10"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-red">Catálogo</p><h1 className="mt-1 text-3xl font-black">{q ? `Resultados para “${q}”` : "Todos los productos"}</h1></div><TiendaProductGrid products={products} /></div>;
}
