"use client";

import { useState, useMemo, ReactNode } from "react";
import { ArrowUpDown, Filter, Search, X } from "lucide-react";

export type Col<T> = {
  key: string;
  head: string;
  /** valor para mostrar */
  cell: (row: T) => ReactNode;
  /** valor para ordenar/filtrar (número o string) */
  value?: (row: T) => string | number;
  /** activa filtro por valores únicos (estado, canal…) */
  filter?: boolean;
  /** activa orden asc/desc (fecha, total…) */
  sort?: boolean;
  className?: string;
};

export function FilterableTable<T>({
  rows,
  cols,
  rowKey,
  search,
  searchPlaceholder = "Buscar…",
  rowClassName,
}: {
  rows: T[];
  cols: Col<T>[];
  rowKey: (row: T) => string | number;
  /** función que devuelve el texto buscable de una fila */
  search?: (row: T) => string;
  searchPlaceholder?: string;
  /** clases extra por fila (p. ej. para atenuar filas ocultas) */
  rowClassName?: (row: T) => string;
}) {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const valOf = (c: Col<T>, r: T) => (c.value ? c.value(r) : String(c.cell(r) ?? ""));

  const opciones = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const c of cols)
      if (c.filter) m[c.key] = [...new Set(rows.map((r) => String(valOf(c, r))))].sort();
    return m;
  }, [rows, cols]);

  const filtered = useMemo(() => {
    let out = rows;
    if (q && search) {
      const t = q.toLowerCase();
      out = out.filter((r) => search(r).toLowerCase().includes(t));
    }
    for (const c of cols) {
      const sel = filters[c.key];
      if (sel && sel.size) out = out.filter((r) => sel.has(String(valOf(c, r))));
    }
    if (sortKey) {
      const c = cols.find((x) => x.key === sortKey);
      if (c) {
        out = [...out].sort((a, b) => {
          const va = valOf(c, a), vb = valOf(c, b);
          const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, q, filters, sortKey, sortDir, cols, search]);

  function toggleFiltro(key: string, val: string) {
    setFilters((f) => {
      const s = new Set(f[key] ?? []);
      s.has(val) ? s.delete(val) : s.add(val);
      return { ...f, [key]: s };
    });
  }

  const activos = Object.values(filters).reduce((a, s) => a + s.size, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {search && (
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder={searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        )}
        {(activos > 0 || sortKey || q) && (
          <button
            className="btn-ghost text-xs"
            onClick={() => { setFilters({}); setSortKey(null); setQ(""); }}
          >
            <X className="h-3.5 w-3.5" /> Limpiar
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">{filtered.length} resultado(s)</span>
      </div>

      <div className="card overflow-visible">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {cols.map((c) => {
                const sel = filters[c.key];
                const active = (sel && sel.size > 0) || sortKey === c.key;
                return (
                  <th key={c.key} className="relative px-4 py-3 font-medium">
                    {c.filter || c.sort ? (
                      <button
                        className={`flex items-center gap-1 hover:text-navy ${active ? "text-navy" : ""}`}
                        onClick={() => {
                          if (c.sort && !c.filter) {
                            setSortKey(c.key);
                            setSortDir((d) => (sortKey === c.key && d === "desc" ? "asc" : "desc"));
                          } else {
                            setOpen((o) => (o === c.key ? null : c.key));
                          }
                        }}
                      >
                        {c.head}
                        {c.filter ? <Filter className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3" />}
                        {sel && sel.size > 0 && <span className="rounded-full bg-navy px-1.5 text-[9px] text-white">{sel.size}</span>}
                      </button>
                    ) : (
                      c.head
                    )}

                    {open === c.key && c.filter && (
                      <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                        {c.sort && (
                          <div className="mb-1 flex gap-1 border-b border-slate-100 pb-1">
                            <button className="btn-ghost flex-1 py-1 text-[11px]" onClick={() => { setSortKey(c.key); setSortDir("asc"); setOpen(null); }}>↑ Asc</button>
                            <button className="btn-ghost flex-1 py-1 text-[11px]" onClick={() => { setSortKey(c.key); setSortDir("desc"); setOpen(null); }}>↓ Desc</button>
                          </div>
                        )}
                        <div className="max-h-52 overflow-auto">
                          {opciones[c.key]?.map((o) => (
                            <label key={o} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs normal-case text-slate-600 hover:bg-slate-50">
                              <input type="checkbox" checked={sel?.has(o) ?? false} onChange={() => toggleFiltro(c.key, o)} />
                              {o}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={rowKey(r)} className={`hover:bg-slate-50 ${rowClassName?.(r) ?? ""}`}>
                {cols.map((c) => (
                  <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>{c.cell(r)}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={cols.length} className="px-4 py-8 text-center text-slate-400">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
