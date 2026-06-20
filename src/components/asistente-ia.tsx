"use client";

import { useState } from "react";
import { MessageSquare, PenLine, Megaphone, Sparkles, Loader2, TriangleAlert, type LucideIcon } from "lucide-react";
import { accionConsulta, accionDescripcion, accionPublicacion } from "@/app/actions";

type Tab = "consulta" | "descripcion" | "redes";

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "consulta", label: "Consultas del negocio", icon: MessageSquare },
  { id: "descripcion", label: "Descripción de producto", icon: PenLine },
  { id: "redes", label: "Publicación para redes", icon: Megaphone },
];

export function AsistenteIA() {
  const [tab, setTab] = useState<Tab>("consulta");
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn ${tab === t.id ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "consulta" && <Consulta />}
      {tab === "descripcion" && <Descripcion />}
      {tab === "redes" && <Redes />}
    </>
  );
}

function Salida({ texto, error, loading }: { texto: string; error: string; loading: boolean }) {
  if (loading) {
    return (
      <div className="card mt-4 flex items-center gap-2 p-5 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Generando respuesta…
      </div>
    );
  }
  if (error) {
    return (
      <div className="card mt-4 flex items-start gap-2 border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
      </div>
    );
  }
  if (!texto) return null;
  return <div className="card mt-4 whitespace-pre-wrap p-5 text-sm leading-relaxed text-slate-700">{texto}</div>;
}

function Consulta() {
  const [q, setQ] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const ejemplos = ["¿Qué productos tienen stock bajo?", "¿Cuánto vendí en total?", "¿Cuál es el valor de mi inventario?"];

  async function preguntar(pregunta: string) {
    setQ(pregunta);
    setLoading(true);
    const r = await accionConsulta(pregunta);
    setLoading(false);
    setOut(r.ok ? r.texto : "");
    setErr(r.ok ? "" : r.error);
  }

  return (
    <div className="card p-5">
      <div className="flex gap-2">
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Preguntá sobre tu negocio…"
          onKeyDown={(e) => e.key === "Enter" && q && preguntar(q)} />
        <button className="btn-primary" disabled={loading || !q} onClick={() => preguntar(q)}>Preguntar</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ejemplos.map((e) => (
          <button key={e} onClick={() => preguntar(e)} className="badge bg-brand-50 text-brand-700 hover:bg-brand-100">{e}</button>
        ))}
      </div>
      <Salida texto={out} error={err} loading={loading} />
    </div>
  );
}

function Descripcion() {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [detalles, setDetalles] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function gen() {
    setLoading(true);
    const r = await accionDescripcion(nombre, categoria, detalles);
    setLoading(false);
    setOut(r.ok ? r.texto : "");
    setErr(r.ok ? "" : r.error);
  }

  return (
    <div className="card p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div><label className="label">Producto *</label><input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
        <div><label className="label">Categoría</label><input className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)} /></div>
        <div><label className="label">Detalles</label><input className="input" value={detalles} onChange={(e) => setDetalles(e.target.value)} placeholder="material, color, uso…" /></div>
      </div>
      <button className="btn-primary mt-4" disabled={loading || !nombre} onClick={gen}>
        <Sparkles className="h-4 w-4" /> Generar descripción
      </button>
      <Salida texto={out} error={err} loading={loading} />
    </div>
  );
}

function Redes() {
  const redes = ["instagram", "facebook", "tiktok", "whatsapp"] as const;
  const [nombre, setNombre] = useState("");
  const [red, setRed] = useState<(typeof redes)[number]>("instagram");
  const [promo, setPromo] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function gen() {
    setLoading(true);
    const r = await accionPublicacion(nombre, red, promo);
    setLoading(false);
    setOut(r.ok ? r.texto : "");
    setErr(r.ok ? "" : r.error);
  }

  return (
    <div className="card p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div><label className="label">Producto *</label><input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
        <div>
          <label className="label">Red social</label>
          <select className="input" value={red} onChange={(e) => setRed(e.target.value as (typeof redes)[number])}>
            {redes.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label className="label">Promo / ángulo</label><input className="input" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="20% off, lanzamiento…" /></div>
      </div>
      <button className="btn-primary mt-4" disabled={loading || !nombre} onClick={gen}>
        <Sparkles className="h-4 w-4" /> Generar publicación
      </button>
      <Salida texto={out} error={err} loading={loading} />
    </div>
  );
}
