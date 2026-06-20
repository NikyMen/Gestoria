"use server";

import { db, productos, clientes, compras } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  generarDescripcionProducto,
  generarPublicacionRedes,
  consultaNegocio,
} from "@/lib/ai";
import { getContextoNegocio } from "@/lib/queries";

// --- Productos ---------------------------------------------------------------
export async function crearProducto(formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;
  await db.insert(productos).values({
    sku: String(formData.get("sku") || `SKU-${Date.now()}`),
    nombre,
    categoria: String(formData.get("categoria") || "General"),
    descripcion: String(formData.get("descripcion") || ""),
    precioVenta: Number(formData.get("precioVenta") || 0),
    precioCompra: Number(formData.get("precioCompra") || 0),
    stock: Number(formData.get("stock") || 0),
    stockMinimo: Number(formData.get("stockMinimo") || 5),
  });
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function editarProducto(id: number, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;
  await db
    .update(productos)
    .set({
      nombre,
      sku: String(formData.get("sku") || ""),
      categoria: String(formData.get("categoria") || "General"),
      precioVenta: Number(formData.get("precioVenta") || 0),
      precioCompra: Number(formData.get("precioCompra") || 0),
      stock: Number(formData.get("stock") || 0),
      stockMinimo: Number(formData.get("stockMinimo") || 5),
    })
    .where(eq(productos.id, id));
  revalidatePath("/stock");
  revalidatePath("/");
  revalidatePath("/tienda");
}

export async function eliminarProducto(id: number) {
  await db.delete(productos).where(eq(productos.id, id));
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function ajustarStock(id: number, delta: number) {
  const [p] = await db.select().from(productos).where(eq(productos.id, id));
  if (!p) return;
  await db
    .update(productos)
    .set({ stock: Math.max(0, p.stock + delta) })
    .where(eq(productos.id, id));
  revalidatePath("/stock");
}

export async function togglePublicado(id: number) {
  const [p] = await db.select().from(productos).where(eq(productos.id, id));
  if (!p) return;
  await db.update(productos).set({ publicado: !p.publicado }).where(eq(productos.id, id));
  revalidatePath("/tienda");
  revalidatePath("/stock");
}

export async function guardarDescripcionWeb(id: number, texto: string) {
  await db.update(productos).set({ descripcionWeb: texto }).where(eq(productos.id, id));
  revalidatePath("/tienda");
}

// --- Clientes ----------------------------------------------------------------
export async function crearCliente(formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;
  await db.insert(clientes).values({
    nombre,
    email: String(formData.get("email") || ""),
    telefono: String(formData.get("telefono") || ""),
    cuit: String(formData.get("cuit") || ""),
    direccion: String(formData.get("direccion") || ""),
  });
  revalidatePath("/clientes");
}

// --- Compras -----------------------------------------------------------------
export async function crearCompra(formData: FormData) {
  const proveedor = String(formData.get("proveedor") || "").trim();
  if (!proveedor) return;
  await db.insert(compras).values({
    proveedor,
    total: Number(formData.get("total") || 0),
    estado: String(formData.get("estado") || "recibida"),
  });
  revalidatePath("/compras");
  revalidatePath("/");
}

// --- IA ----------------------------------------------------------------------
export async function accionDescripcion(nombre: string, categoria: string, detalles: string) {
  try {
    return { ok: true as const, texto: await generarDescripcionProducto({ nombre, categoria, detalles }) };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function accionPublicacion(
  nombre: string,
  red: "instagram" | "facebook" | "tiktok" | "whatsapp",
  promo: string
) {
  try {
    return { ok: true as const, texto: await generarPublicacionRedes({ nombre, red, promo }) };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function accionConsulta(pregunta: string) {
  try {
    const contexto = await getContextoNegocio();
    return { ok: true as const, texto: await consultaNegocio({ pregunta, contexto }) };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
