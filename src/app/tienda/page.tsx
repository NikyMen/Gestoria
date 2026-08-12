import Link from "next/link";
import { ShieldCheck, Bird, Truck, MapPin, Flame } from "lucide-react";
import { listTiendaOfertas, listTiendaProductos, tiendaToStoreProduct, tiendaToSuperOferta } from "@/lib/tienda";
import { PromoCarousel } from "@/components/store/PromoCarousel";
import { ProductCatalog } from "@/components/store/ProductCatalog";
import { SuperOfertaHero } from "@/components/store/SuperOfertaHero";
import { AvisoTurnos } from "@/components/store/AvisoTurnos";
import { sucursales } from "@/lib/sucursales";
import { versionImageUrl } from "@/lib/image-url";
import { WHATSAPP_SOPORTE_TEXTO, WHATSAPP_SOPORTE_URL, WHATSAPP_VISIBLE } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function TiendaHomePage() {
  const [rows, offerRows] = await Promise.all([listTiendaProductos(), listTiendaOfertas()]);
  const productos = rows.map(tiendaToStoreProduct);
  const ofertas = offerRows.map(tiendaToStoreProduct);
  const superOferta = offerRows[0] ? tiendaToSuperOferta(offerRows[0]) : null;
  const ofertasDelDia = superOferta ? ofertas.slice(1) : ofertas;

  return (
    <div className="space-y-8 md:space-y-14">
      {superOferta ? <SuperOfertaHero oferta={superOferta} cartProduct={productos.find((p) => p.id === superOferta.cartProductId)} /> : <HeroClasico />}
      {ofertasDelDia.length > 0 && <section className="px-4 md:px-6"><div className="mb-3 flex items-center justify-between md:mb-6"><h2 className="relative flex items-center gap-2 pb-1 text-lg font-bold uppercase text-brand-ink md:text-2xl"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gold text-brand-ink md:h-10 md:w-10"><Flame size={20} /></span>Ofertas del día<span className="absolute bottom-0 left-0 h-0.5 w-12 rounded bg-brand-gold md:h-1 md:w-16" /></h2><Link href="/tienda/ofertas" className="text-sm font-semibold text-brand-red md:text-base">Ver todas</Link></div><div className="rounded-2xl bg-gradient-to-r from-brand-gold/15 via-brand-gold/5 to-transparent p-2 ring-1 ring-brand-gold/30 md:rounded-3xl md:p-4"><PromoCarousel products={ofertasDelDia} /></div></section>}
      <section className="px-4 md:px-6"><div className="mb-3 md:mb-6"><h2 className="relative pb-1 text-lg font-bold text-brand-ink md:text-2xl">Productos<span className="absolute bottom-0 left-0 h-0.5 w-12 rounded bg-brand-red md:h-1 md:w-16" /></h2></div><ProductCatalog products={productos} /></section>
      <section className="px-4 md:px-6"><AvisoTurnos /></section>
      <section className="px-4 md:px-6"><div className="mb-3 md:mb-6"><h2 className="relative pb-1 text-lg font-bold text-brand-ink md:text-2xl">Nuestras sucursales<span className="absolute bottom-0 left-0 h-0.5 w-12 rounded bg-brand-red md:h-1 md:w-16" /></h2><p className="mt-2 text-xs text-brand-ink/60 md:text-sm">8 sucursales en Corrientes. Todos los pedidos se hacen desde la web y se entregan a domicilio.</p></div><div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">{sucursales.map((s) => <Link key={s.id} href={`/tienda/sucursales?s=${s.id}`} className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-soft transition hover:shadow-md hover:ring-1 hover:ring-brand-red/40 md:p-4"><MapPin size={18} className="shrink-0 text-brand-red" /><p className="min-w-0 text-xs font-semibold leading-tight text-brand-ink md:text-sm">{s.address}</p></Link>)}</div></section>
      <section className="px-4 md:px-6"><div className="flex items-center gap-3 rounded-2xl bg-brand-gold p-4 shadow-soft md:gap-6 md:rounded-3xl md:p-8"><div className="flex-1"><h3 className="text-base font-extrabold leading-tight text-brand-ink md:text-3xl">{WHATSAPP_SOPORTE_TEXTO}</h3><p className="mt-1 text-xs text-brand-ink/70 md:mt-2 md:text-base">📱 {WHATSAPP_VISIBLE} · Estamos para ayudarte con tu pedido.</p></div><span className="text-4xl md:text-6xl" aria-hidden>💬</span><a href={WHATSAPP_SOPORTE_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-brand-red px-3 py-2 text-xs font-bold text-white md:px-6 md:py-3 md:text-base">Escribinos</a></div></section>
      <section className="px-4 pb-2 md:hidden"><div className="grid grid-cols-3 gap-2 text-center"><Feature icon={ShieldCheck} title="Calidad" subtitle="Garantizada" /><Feature icon={Bird} title="Pollo Fresco" subtitle="Todos los Días" /><Feature icon={Truck} title="Envíos" subtitle="A domicilio" /></div></section>
    </div>
  );
}

function HeroClasico() {
  return <section className="relative mx-4 mt-3 overflow-hidden rounded-2xl md:mx-6 md:mt-6 md:rounded-3xl"><img src={versionImageUrl("/fondo-polleria.png")} alt="Pollería Entre Ríos" className="h-56 w-full object-cover object-top sm:h-72 md:h-[420px]" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/50 md:to-transparent" /><div className="absolute inset-0 flex flex-col justify-end p-4 md:max-w-xl md:justify-center md:p-12"><span className="hidden text-sm font-semibold uppercase tracking-[0.3em] text-brand-gold md:block">Pollería Entre Ríos · Corrientes</span><h1 className="font-display text-2xl font-bold uppercase leading-tight text-white md:mt-3 md:text-5xl">El mejor pollo,<br />siempre fresco<br />y al mejor precio</h1><p className="mt-2 hidden text-white/80 md:block md:text-lg">Calidad, variedad y sabor para compartir en familia. Pedí online y recibilo en tu casa.</p><div className="mt-3 flex gap-3 md:mt-6"><Link href="/tienda/productos" className="btn-gold md:px-6 md:py-3 md:text-base">Pedí ahora</Link><Link href="/tienda/ofertas" className="hidden items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-base font-bold text-white hover:bg-white/10 md:inline-flex">Ver ofertas</Link></div></div></section>;
}

function Feature({ icon: Icon, title, subtitle }: { icon: typeof ShieldCheck; title: string; subtitle: string }) {
  return <div className="flex flex-col items-center gap-1"><Icon className="text-brand-red" size={26} /><span className="text-xs font-bold text-brand-ink">{title}</span><span className="text-[11px] text-brand-ink/55">{subtitle}</span></div>;
}
