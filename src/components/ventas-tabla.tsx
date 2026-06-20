"use client";

import { FilterableTable, Col } from "@/components/filterable-table";
import { Estado } from "@/components/ui";
import { money, fecha } from "@/lib/format";

type Venta = { id: number; total: number; estado: string; canal: string; fecha: number | Date | null; cliente: string | null };

export function VentasTabla({ ventas }: { ventas: Venta[] }) {
  const cols: Col<Venta>[] = [
    { key: "id", head: "#", cell: (v) => <span className="text-slate-400">#{v.id}</span>, value: (v) => v.id, sort: true },
    { key: "cliente", head: "Cliente", cell: (v) => <span className="font-medium">{v.cliente ?? "Consumidor final"}</span>, value: (v) => v.cliente ?? "Consumidor final" },
    { key: "canal", head: "Canal", cell: (v) => <Estado value={v.canal} />, value: (v) => v.canal, filter: true },
    { key: "estado", head: "Estado", cell: (v) => <Estado value={v.estado} />, value: (v) => v.estado, filter: true },
    { key: "facturada", head: "Facturada", cell: (v) => <span className="text-slate-500">{v.estado === "completada" ? "Sí" : "—"}</span>, value: (v) => (v.estado === "completada" ? "Sí" : "No"), filter: true },
    { key: "fecha", head: "Fecha", cell: (v) => <span className="text-slate-500">{fecha(v.fecha)}</span>, value: (v) => (v.fecha instanceof Date ? v.fecha.getTime() : Number(v.fecha)), sort: true },
    { key: "total", head: "Total", cell: (v) => <span className="font-semibold">{money(v.total)}</span>, value: (v) => v.total, sort: true, className: "font-semibold" },
  ];
  return (
    <FilterableTable
      rows={ventas}
      cols={cols}
      rowKey={(v) => v.id}
      search={(v) => `${v.id} ${v.cliente ?? "consumidor final"} ${v.estado} ${v.canal} ${v.total}`}
      searchPlaceholder="Buscar por cliente, estado, total…"
    />
  );
}
