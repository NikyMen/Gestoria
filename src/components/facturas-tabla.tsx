"use client";

import { FilterableTable, Col } from "@/components/filterable-table";
import { Estado } from "@/components/ui";
import { money, fecha } from "@/lib/format";

type Factura = { id: number; numero: string; total: number; tipo: string; estado: string; fecha: number | Date | null; cliente: string | null };

export function FacturasTabla({ facturas }: { facturas: Factura[] }) {
  const cols: Col<Factura>[] = [
    { key: "numero", head: "Comprobante", cell: (f) => <span className="font-mono text-xs">{f.numero}</span>, value: (f) => f.numero },
    { key: "tipo", head: "Tipo", cell: (f) => <span className="badge bg-slate-100 text-slate-600">{f.tipo}</span>, value: (f) => f.tipo, filter: true },
    { key: "cliente", head: "Cliente", cell: (f) => <span className="font-medium">{f.cliente ?? "Consumidor final"}</span>, value: (f) => f.cliente ?? "Consumidor final" },
    { key: "estado", head: "Estado", cell: (f) => <Estado value={f.estado} />, value: (f) => f.estado, filter: true },
    { key: "fecha", head: "Fecha", cell: (f) => <span className="text-slate-500">{fecha(f.fecha)}</span>, value: (f) => (f.fecha instanceof Date ? f.fecha.getTime() : Number(f.fecha)), sort: true },
    { key: "total", head: "Total", cell: (f) => <span className="font-semibold">{money(f.total)}</span>, value: (f) => f.total, sort: true, className: "font-semibold" },
  ];
  return (
    <FilterableTable
      rows={facturas}
      cols={cols}
      rowKey={(f) => f.id}
      search={(f) => `${f.numero} ${f.cliente ?? "consumidor final"} ${f.tipo} ${f.estado} ${f.total}`}
      searchPlaceholder="Buscar por comprobante, cliente, estado, total…"
    />
  );
}
