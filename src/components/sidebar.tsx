"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { tieneAcceso, type ModuloKey, type UsuarioActual } from "@/lib/permisos";
import {
  LayoutDashboard,
  TrendingUp,
  Truck,
  Boxes,
  Users,
  UserCog,
  ReceiptText,
  Store,
  Sparkles,
  MessageCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react";

const nav: { href: string; label: string; icon: LucideIcon; modulo: ModuloKey }[] = [
  { href: "/", label: "Panel", icon: LayoutDashboard, modulo: "panel" },
  { href: "/stock", label: "Stock", icon: Boxes, modulo: "stock" },
  { href: "/ventas", label: "Ventas", icon: TrendingUp, modulo: "ventas" },
  { href: "/compras", label: "Compras", icon: Truck, modulo: "compras" },
  { href: "/clientes", label: "Clientes", icon: Users, modulo: "clientes" },
  { href: "/facturacion", label: "Facturación", icon: ReceiptText, modulo: "facturacion" },
  { href: "/tienda", label: "Tienda online", icon: Store, modulo: "tienda" },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, modulo: "whatsapp" },
  { href: "/ia", label: "Asistente IA", icon: Sparkles, modulo: "ia" },
  { href: "/equipo", label: "Equipo", icon: UserCog, modulo: "equipo" },
];

export function Sidebar({ usuario }: { usuario: UsuarioActual }) {
  const path = usePathname();
  const visibles = nav.filter((item) => tieneAcceso(usuario, item.modulo));
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy px-4 py-6 text-slate-300 md:flex">
      <div className="mb-8 px-2">
        <Image src="/brand/logo-cd.webp" alt="Consultoría Digital" width={180} height={120} className="h-auto w-40" priority />
        <p className="mt-3 text-xs font-semibold tracking-wide text-lime">GestorIA</p>
        <p className="text-[11px] text-slate-500">ERP con Inteligencia Artificial</p>
      </div>

      <nav className="flex flex-col gap-1">
        {visibles.map((item) => {
          const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active ? "bg-lime/15 text-lime" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-lime/20 bg-lime/10 p-4">
          <p className="text-sm font-semibold text-lime">GestorIA Starter</p>
          <p className="mt-1 text-xs text-slate-400">
            La IA transforma tus productos en contenido listo para vender.
          </p>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">{usuario.nombre}</p>
            <p className="text-[11px] text-slate-500">
              {usuario.rol === "admin" ? "Administrador" : "Miembro"}
            </p>
          </div>
          <form action={logout}>
            <button
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:text-rose-400"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
