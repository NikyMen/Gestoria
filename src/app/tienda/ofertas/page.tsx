import { Flame } from "lucide-react";
import { listTiendaOfertas } from "@/lib/tienda";
import { TiendaProductGrid } from "@/components/tienda/StoreShell";

export const dynamic = "force-dynamic";

export default async function TiendaOfertasPage() {
  const products = await listTiendaOfertas();
  return <div className="space-y-6 px-4 py-6 md:px-6 md:py-10"><div className="flex items-center gap-3 rounded-2xl bg-brand-red p-5 text-white"><Flame size={28} /><div><h1 className="text-2xl font-black">Ofertas</h1><p className="text-sm text-white/75">Promociones publicadas desde tu panel.</p></div></div>{products.length ? <TiendaProductGrid products={products} /> : <div className="rounded-2xl bg-white p-10 text-center text-sm text-brand-ink/60">Todavía no hay ofertas publicadas.</div>}</div>;
}
