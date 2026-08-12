import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, Flame, Truck } from "lucide-react";
import { listTiendaOfertas, listTiendaProductos } from "@/lib/tienda";
import { TiendaProductGrid, StoreSearchLink, ArrowLink } from "@/components/tienda/StoreShell";

export const dynamic = "force-dynamic";

export default async function TiendaHomePage() {
  const [productos, ofertas] = await Promise.all([listTiendaProductos(), listTiendaOfertas()]);
  const destacados = ofertas.length ? ofertas.slice(0, 4) : productos.slice(0, 4);
  return (
    <div className="space-y-10 py-4 md:py-8">
      <section className="relative mx-4 overflow-hidden rounded-3xl bg-brand-red bg-cover bg-center px-5 py-10 text-white shadow-lg md:mx-6 md:px-12 md:py-16" style={{ backgroundImage: "linear-gradient(90deg, rgba(120, 0, 20, .92), rgba(200, 16, 46, .55)), url('/fondo-polleria.png')" }}>
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-gold/30 blur-2xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">Tienda online conectada a GestorIA</p>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-6xl">Comprá desde tu stock real.</h1>
          <p className="mt-4 max-w-xl text-sm text-white/80 md:text-lg">Elegí tus productos, confirmá la entrega y pagá online. Los precios y la disponibilidad se validan directamente contra el inventario.</p>
          <div className="mt-7 flex flex-wrap gap-3"><StoreSearchLink /><Link href="/tienda/ofertas" className="inline-flex items-center gap-2 rounded-xl bg-brand-gold px-4 py-2 text-sm font-bold text-brand-ink hover:brightness-95">Ver ofertas <ArrowRight size={16} /></Link></div>
        </div>
      </section>
      <section className="grid gap-3 px-4 md:grid-cols-3 md:px-6">
        <Feature icon={<CheckCircle2 />} title="Stock actualizado" text="La tienda muestra el inventario de GestorIA." />
        <Feature icon={<Truck />} title="Entrega a domicilio" text="Completá tus datos al finalizar el pedido." />
        <Feature icon={<Flame />} title="Promociones" text="Publicá ofertas desde el panel interno." />
      </section>
      {destacados.length > 0 && <section className="px-4 md:px-6"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-red">Elegidos para vos</p><h2 className="mt-1 text-2xl font-black">Destacados</h2></div><ArrowLink href="/tienda/productos">Ver catálogo</ArrowLink></div><TiendaProductGrid products={destacados} /></section>}
      <section className="px-4 md:px-6"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-red">Catálogo</p><h2 className="mt-1 text-2xl font-black">Todos los productos</h2></div><ArrowLink href="/tienda/productos">Buscar productos</ArrowLink></div><TiendaProductGrid products={productos} /></section>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"><span className="rounded-xl bg-brand-red/10 p-2 text-brand-red">{icon}</span><div><p className="font-bold">{title}</p><p className="mt-1 text-xs text-brand-ink/60">{text}</p></div></div>;
}
