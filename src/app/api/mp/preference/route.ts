import { NextResponse } from "next/server";
import { sql, eq } from "drizzle-orm";
import { db, productos, ventas, ventaItems } from "@/db";
import { crearPreferencia, mercadopagoConfigurado } from "@/lib/mercadopago";

export const runtime = "nodejs";

type ItemReq = { productoId: number; cantidad: number };

// Inicia un checkout: valida el carrito en el server, crea la venta como
// "pendiente" y devuelve el link de pago de MercadoPago. El stock se descuenta
// recién cuando el webhook confirma el pago aprobado.
export async function POST(req: Request) {
  if (!mercadopagoConfigurado()) {
    return NextResponse.json({ error: "La tienda no está disponible por el momento." }, { status: 503 });
  }

  let body: { items?: ItemReq[] };
  try {
    body = (await req.json()) as { items?: ItemReq[] };
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const limpios = (body.items ?? []).filter((i) => i && i.productoId > 0 && i.cantidad > 0);
  if (limpios.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }

  // Traemos los productos para fijar precio (nunca confiamos en el del cliente)
  // y validar publicación + stock.
  const ids = limpios.map((i) => i.productoId);
  const prods = await db.select().from(productos).where(sql`${productos.id} in ${ids}`);
  const byId = new Map(prods.map((p) => [p.id, p]));

  for (const it of limpios) {
    const p = byId.get(it.productoId);
    if (!p || !p.publicado) {
      return NextResponse.json({ error: "Hay un producto que ya no está disponible." }, { status: 400 });
    }
    if (p.stock < it.cantidad) {
      return NextResponse.json({ error: `Sin stock suficiente de "${p.nombre}" (quedan ${p.stock}).` }, { status: 400 });
    }
  }

  const total = limpios.reduce((a, it) => a + byId.get(it.productoId)!.precioVenta * it.cantidad, 0);

  const [venta] = await db
    .insert(ventas)
    .values({ total, estado: "pendiente", canal: "online", medioPago: "mercadopago" })
    .returning({ id: ventas.id });

  for (const it of limpios) {
    const p = byId.get(it.productoId)!;
    await db.insert(ventaItems).values({
      ventaId: venta.id,
      productoId: p.id,
      cantidad: it.cantidad,
      precioUnit: p.precioVenta,
    });
  }

  try {
    const { initPoint } = await crearPreferencia({
      ventaId: venta.id,
      items: limpios.map((it) => {
        const p = byId.get(it.productoId)!;
        return { title: p.nombre, quantity: it.cantidad, unit_price: p.precioVenta };
      }),
    });
    return NextResponse.json({ initPoint });
  } catch (e) {
    // Si MercadoPago falla, cancelamos la venta pendiente para no dejarla colgada.
    await db.update(ventas).set({ estado: "cancelada" }).where(eq(ventas.id, venta.id));
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
