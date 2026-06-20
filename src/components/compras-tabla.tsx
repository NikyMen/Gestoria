"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FilterableTable, Col } from "@/components/filterable-table";
import { Estado } from "@/components/ui";
import { money, fecha } from "@/lib/format";
import type { Compra } from "@/db/schema";
import { crearCompra } from "@/app/actions";

export function ComprasTabla({ compras }: { compras: Compra[] }) {
  const [open, setOpen] = useState(false);

  const cols: Col<Compra>[] = [
    { key: "id", head: "#", cell: (c) => <span className="text-slate-400">#{c.id}</span>, value: (c) => c.id, sort: true },
    { key: "proveedor", head: "Proveedor", cell: (c) => <span className="font-medium">{c.proveedor}</span>, value: (c) => c.proveedor, filter: true },
    { key: "estado", head: "Estado", cell: (c) => <Estado value={c.estado} />, value: (c) => c.estado, filter: true },
    { key: "fecha", head: "Fecha", cell: (c) => <span className="text-slate-500">{fecha(c.fecha)}</span>, value: (c) => (c.fecha instanceof Date ? c.fecha.getTime() : Number(c.fecha)), sort: true },
    { key: "total", head: "Total", cell: (c) => <span className="font-semibold">{money(c.total)}</span>, value: (c) => c.total, sort: true, className: "font-semibold" },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => setOpen((v) => !v)}>
          {open ? "Cerrar" : <><Plus className="h-4 w-4" /> Nueva compra</>}
        </button>
      </div>

      {open && <NuevaCompra onDone={() => setOpen(false)} />}

      <FilterableTable
        rows={compras}
        cols={cols}
        rowKey={(c) => c.id}
        search={(c) => `${c.id} ${c.proveedor} ${c.estado} ${c.total}`}
        searchPlaceholder="Buscar por proveedor, estado, total…"
      />
    </>
  );
}

function NuevaCompra({ onDone }: { onDone: () => void }) {
  return (
    <form action={async (fd) => { await crearCompra(fd); onDone(); }} className="card mb-6 p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Proveedor *</label>
          <input name="proveedor" className="input" required />
        </div>
        <div>
          <label className="label">Total</label>
          <input name="total" type="number" step="0.01" className="input" defaultValue={0} />
        </div>
        <div>
          <label className="label">Estado</label>
          <select name="estado" className="input" defaultValue="recibida">
            <option value="recibida">Recibida</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" className="btn-primary">Guardar compra</button>
        <button type="button" className="btn-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </form>
  );
}
