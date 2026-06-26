"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, CheckCircle2, Banknote, QrCode, CreditCard, X } from "lucide-react";
import type { Producto } from "@/db/schema";
import { money } from "@/lib/format";
import { cobrarVenta, type MedioPago } from "@/app/actions";

type Linea = { producto: Producto; cantidad: number };
type Ticket = { ventaId: number; total: number; items: number; medioPago: MedioPago };

const MEDIOS: { id: MedioPago; label: string; icon: typeof Banknote }[] = [
  { id: "efectivo", label: "Efectivo", icon: Banknote },
  { id: "qr", label: "QR", icon: QrCode },
  { id: "tarjeta", label: "Tarjeta", icon: CreditCard },
];
const ETIQUETA_MEDIO: Record<MedioPago, string> = { efectivo: "Efectivo", qr: "QR", tarjeta: "Tarjeta" };

export function CajaPOS({ productos }: { productos: Producto[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<Linea[]>([]);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [eligiendoPago, setEligiendoPago] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Mapa stock disponible considerando lo que ya está en el carrito.
  const enCarrito = useMemo(() => {
    const m = new Map<number, number>();
    for (const l of carrito) m.set(l.producto.id, l.cantidad);
    return m;
  }, [carrito]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos.slice(0, 24);
    return productos
      .filter((p) => `${p.nombre} ${p.sku} ${p.categoria}`.toLowerCase().includes(q))
      .slice(0, 24);
  }, [busqueda, productos]);

  const total = carrito.reduce((a, l) => a + l.producto.precioVenta * l.cantidad, 0);
  const unidades = carrito.reduce((a, l) => a + l.cantidad, 0);

  function agregar(p: Producto, delta = 1) {
    setError("");
    setTicket(null);
    setCarrito((prev) => {
      const existe = prev.find((l) => l.producto.id === p.id);
      const actual = existe?.cantidad ?? 0;
      const siguiente = actual + delta;
      if (siguiente > p.stock) {
        setError(`Sin stock suficiente de "${p.nombre}" (quedan ${p.stock}).`);
        return prev;
      }
      if (siguiente <= 0) return prev.filter((l) => l.producto.id !== p.id);
      if (existe) return prev.map((l) => (l.producto.id === p.id ? { ...l, cantidad: siguiente } : l));
      return [...prev, { producto: p, cantidad: 1 }];
    });
  }

  function quitar(id: number) {
    setCarrito((prev) => prev.filter((l) => l.producto.id !== id));
  }

  // Enter en el buscador: si hay match exacto de SKU lo agrega (lector de
  // código de barras), si no agrega el primer resultado. Limpia para el próximo.
  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = busqueda.trim().toLowerCase();
    if (!q) return;
    const exacto = productos.find((p) => p.sku.toLowerCase() === q);
    const elegido = exacto ?? filtrados[0];
    if (elegido) {
      agregar(elegido);
      setBusqueda("");
    }
  }

  function cobrar() {
    if (carrito.length === 0) return;
    setError("");
    setEligiendoPago(true);
  }

  function confirmarPago(medioPago: MedioPago) {
    if (carrito.length === 0) return;
    setError("");
    const items = carrito.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad }));
    const unidadesPedido = unidades;
    startTransition(async () => {
      const r = await cobrarVenta(items, medioPago);
      if (!r.ok) return setError(r.error);
      setTicket({ ventaId: r.ventaId, total: r.total, items: unidadesPedido, medioPago });
      setCarrito([]);
      setBusqueda("");
      setEligiendoPago(false);
      inputRef.current?.focus();
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      {/* Catálogo + buscador */}
      <div className="card flex flex-col p-4">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={onSearchKey}
            placeholder="Buscar o escanear: nombre, SKU o categoría… (Enter agrega)"
            className="input pl-9"
          />
        </div>

        <div className="grid max-h-[65vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((p) => {
            const usado = enCarrito.get(p.id) ?? 0;
            const agotado = p.stock - usado <= 0;
            return (
              <button
                key={p.id}
                onClick={() => agregar(p)}
                disabled={agotado}
                className="flex flex-col rounded-xl border border-slate-200 p-3 text-left transition hover:border-lime hover:bg-lime/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="line-clamp-2 text-sm font-medium leading-tight">{p.nombre}</span>
                <span className="mt-1 font-mono text-[11px] text-slate-400">{p.sku}</span>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-base font-bold text-navy">{money(p.precioVenta)}</span>
                  <span className={`text-[11px] ${agotado ? "text-rose-500" : "text-slate-400"}`}>
                    {agotado ? "sin stock" : `stock ${p.stock - usado}`}
                  </span>
                </div>
              </button>
            );
          })}
          {filtrados.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-slate-400">
              No hay productos que coincidan con “{busqueda}”.
            </p>
          )}
        </div>
      </div>

      {/* Pedido / ticket */}
      <div className="card flex h-fit flex-col p-4 lg:sticky lg:top-4">
        <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShoppingCart className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold">Pedido</h2>
          {unidades > 0 && (
            <span className="ml-auto badge bg-lime/15 text-navy">{unidades} u.</span>
          )}
        </div>

        {carrito.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            {ticket ? (
              <div className="flex flex-col items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
                <p className="font-semibold">¡Cobrado!</p>
                <p className="text-slate-500">
                  Venta #{ticket.ventaId} · {ticket.items} u. · {money(ticket.total)}
                </p>
                <p className="text-xs text-slate-400">Pago: {ETIQUETA_MEDIO[ticket.medioPago]}</p>
                <p className="mt-1 text-xs text-slate-400">Listo para el próximo cliente.</p>
              </div>
            ) : (
              "Tocá un producto o escaneá para empezar."
            )}
          </div>
        ) : (
          <div className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto">
            {carrito.map((l) => (
              <div key={l.producto.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.producto.nombre}</p>
                  <p className="text-xs text-slate-400">
                    {money(l.producto.precioVenta)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn-ghost px-1.5 py-1" onClick={() => agregar(l.producto, -1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{l.cantidad}</span>
                  <button className="btn-ghost px-1.5 py-1" onClick={() => agregar(l.producto, 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="w-20 text-right text-sm font-semibold">
                  {money(l.producto.precioVenta * l.cantidad)}
                </span>
                <button className="btn-ghost px-1.5 py-1 text-rose-500" onClick={() => quitar(l.producto.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="mb-3 flex items-end justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-2xl font-bold text-navy">{money(total)}</span>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-primary flex-1 justify-center py-3 text-base"
              disabled={carrito.length === 0 || pendiente}
              onClick={cobrar}
            >
              {pendiente ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cobrar"}
            </button>
            {carrito.length > 0 && (
              <button
                className="btn-ghost"
                disabled={pendiente}
                onClick={() => { setCarrito([]); setError(""); }}
              >
                Vaciar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selector de medio de pago */}
      {eligiendoPago && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
          onClick={() => !pendiente && setEligiendoPago(false)}
        >
          <div
            className="card w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">¿Cómo paga?</h3>
                <p className="text-sm text-slate-500">Total {money(total)} · {unidades} u.</p>
              </div>
              <button
                className="btn-ghost px-1.5 py-1"
                disabled={pendiente}
                onClick={() => setEligiendoPago(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MEDIOS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    disabled={pendiente}
                    onClick={() => confirmarPago(m.id)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 py-4 transition hover:border-lime hover:bg-lime/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon className="h-6 w-6 text-navy" />
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {pendiente && (
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando cobro…
              </p>
            )}
            {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
