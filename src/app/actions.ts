"use server";

import { db, productos, clientes, compras, ventas, ventaItems } from "@/db";
import { eq, sql } from "drizzle-orm";
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

// --- Caja (punto de venta) ---------------------------------------------------
type ItemCaja = { productoId: number; cantidad: number };
export type MedioPago = "efectivo" | "qr" | "tarjeta";
const MEDIOS_PAGO: MedioPago[] = ["efectivo", "qr", "tarjeta"];

// Cierra un pedido de caja: registra la venta + ítems y descuenta stock.
// Devuelve el id y total para mostrar el ticket sin recargar.
export async function cobrarVenta(items: ItemCaja[], medioPago: MedioPago = "efectivo") {
  const limpios = items.filter((i) => i.cantidad > 0);
  if (limpios.length === 0) return { ok: false as const, error: "El pedido está vacío." };

  // Traemos los productos involucrados para fijar precio y validar stock.
  const ids = limpios.map((i) => i.productoId);
  const prods = await db.select().from(productos).where(sql`${productos.id} in ${ids}`);
  const byId = new Map(prods.map((p) => [p.id, p]));

  for (const it of limpios) {
    const p = byId.get(it.productoId);
    if (!p) return { ok: false as const, error: "Hay un producto que ya no existe." };
    if (p.stock < it.cantidad)
      return { ok: false as const, error: `Sin stock suficiente de "${p.nombre}" (quedan ${p.stock}).` };
  }

  const total = limpios.reduce((a, it) => a + (byId.get(it.productoId)!.precioVenta * it.cantidad), 0);

  const medio = MEDIOS_PAGO.includes(medioPago) ? medioPago : "efectivo";

  const [venta] = await db
    .insert(ventas)
    .values({ total, estado: "completada", canal: "local", medioPago: medio })
    .returning({ id: ventas.id });

  for (const it of limpios) {
    const p = byId.get(it.productoId)!;
    await db.insert(ventaItems).values({
      ventaId: venta.id,
      productoId: p.id,
      cantidad: it.cantidad,
      precioUnit: p.precioVenta,
    });
    await db
      .update(productos)
      .set({ stock: Math.max(0, p.stock - it.cantidad) })
      .where(eq(productos.id, p.id));
  }

  revalidatePath("/caja");
  revalidatePath("/ventas");
  revalidatePath("/stock");
  revalidatePath("/");
  return { ok: true as const, ventaId: venta.id, total };
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
