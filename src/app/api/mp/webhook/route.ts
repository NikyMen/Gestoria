import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, ventas, ventaItems } from "@/db";
import { obtenerPago } from "@/lib/mercadopago";
import { descontarStock } from "@/lib/stock";

export const runtime = "nodejs";

type MpBody = { type?: string; action?: string; data?: { id?: string | number } };

// MercadoPago notifica de varias formas (webhook nuevo: ?type=payment&data.id=…;
// IPN viejo: ?topic=payment&id=…; o todo en el body). Extraemos el id del pago.
function extraerPaymentId(url: URL, body: MpBody): string | null {
  const tipo = url.searchParams.get("type") || url.searchParams.get("topic") || body.type;
  if (tipo && tipo !== "payment") return null; // solo nos interesan pagos

  const id =
    (body.data?.id != null ? String(body.data.id) : null) ||
    url.searchParams.get("data.id") ||
    url.searchParams.get("id");
  return id || null;
}

async function procesar(url: URL, body: MpBody): Promise<void> {
  const paymentId = extraerPaymentId(url, body);
  if (!paymentId) return;

  const pago = await obtenerPago(paymentId);
  if (!pago || !pago.externalReference) return;

  const ventaId = Number(pago.externalReference);
  if (!Number.isFinite(ventaId)) return;

  const [venta] = await db.select().from(ventas).where(eq(ventas.id, ventaId));
  if (!venta || venta.estado !== "pendiente") return; // idempotente: ya procesada

  if (pago.status === "approved") {
    await db
      .update(ventas)
      .set({ estado: "completada", referencia: paymentId })
      .where(eq(ventas.id, ventaId));

    // Descontar stock de cada ítem de la venta.
    const items = await db.select().from(ventaItems).where(eq(ventaItems.ventaId, ventaId));
    await descontarStock(items);

    revalidatePath("/ventas");
    revalidatePath("/stock");
    revalidatePath("/");
  } else if (pago.status === "rejected" || pago.status === "cancelled") {
    await db
      .update(ventas)
      .set({ estado: "cancelada", referencia: paymentId })
      .where(eq(ventas.id, ventaId));
  }
}

export async function POST(req: Request) {
  let body: MpBody = {};
  try {
    body = (await req.json()) as MpBody;
  } catch {
    /* el body puede venir vacío con los datos en la query */
  }
  try {
    await procesar(new URL(req.url), body);
  } catch {
    /* nunca fallar duro: devolvemos 200 igual para que MP no reintente en loop */
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  try {
    await procesar(new URL(req.url), {});
  } catch {
    /* idem POST */
  }
  return NextResponse.json({ ok: true });
}
