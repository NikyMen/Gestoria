import { MapPin, Phone } from "lucide-react";

const sucursales = [
  ["Casa central", "Junín 2198"],
  ["Sarmiento", "Sarmiento y La Pampa"],
  ["Cazadores", "Av. Cazadores Correntinos 3038"],
  ["Independencia", "Av. Independencia 5328"],
  ["Libertad", "Av. Libertad 5279"],
];

export default function TiendaSucursalesPage() {
  return <div className="space-y-6 px-4 py-6 md:px-6 md:py-10"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-red">Atención</p><h1 className="mt-1 text-3xl font-black">Sucursales</h1><p className="mt-2 text-sm text-brand-ink/60">Consultá la ubicación más cercana. Los pedidos de la tienda se coordinan con entrega a domicilio.</p></div><div className="grid gap-3 md:grid-cols-2">{sucursales.map(([name, address]) => <article key={name} className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"><span className="rounded-xl bg-brand-red/10 p-3 text-brand-red"><MapPin size={22} /></span><div><h2 className="font-bold">{name}</h2><p className="text-sm text-brand-ink/60">{address}, Corrientes</p><p className="mt-2 flex items-center gap-1 text-xs text-brand-ink/50"><Phone size={13} /> Consultas por WhatsApp</p></div></article>)}</div></div>;
}
