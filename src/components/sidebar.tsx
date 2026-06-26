"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { tieneAcceso, type ModuloKey, type UsuarioActual } from "@/lib/permisos";
import {
  LayoutDashboard,
  ScanLine,
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
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

const nav: { href: string; label: string; icon: LucideIcon; modulo: ModuloKey }[] = [
  { href: "/", label: "Panel", icon: LayoutDashboard, modulo: "panel" },
  { href: "/caja", label: "Caja", icon: ScanLine, modulo: "caja" },
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

function SidebarContent({
  usuario,
  visibles,
  path,
  onNavigate,
}: {
  usuario: UsuarioActual;
  visibles: typeof nav;
  path: string;
  onNavigate?: () => void;
}) {
  return (
    <>
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
              onClick={onNavigate}
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
    </>
  );
}

export function Sidebar({ usuario }: { usuario: UsuarioActual }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const visibles = nav.filter((item) => tieneAcceso(usuario, item.modulo));

  // Cerrar el drawer al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [path]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Barra superior móvil con botón hamburguesa */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-navy px-4 py-3 text-slate-300 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="text-sm font-semibold tracking-wide text-lime">GestorIA</span>
      </header>

      {/* Sidebar fijo en escritorio */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy px-4 py-6 text-slate-300 md:flex">
        <SidebarContent usuario={usuario} visibles={visibles} path={path} />
      </aside>

      {/* Overlay + drawer deslizante en móvil */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto bg-navy px-4 py-6 text-slate-300 shadow-xl transition-transform md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent
          usuario={usuario}
          visibles={visibles}
          path={path}
          onNavigate={() => setOpen(false)}
        />
      </aside>
    </>
  );
}
