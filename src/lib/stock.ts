import { db, productos } from "@/db";
import { eq, sql } from "drizzle-orm";

// Descuenta stock con un update atómico (nunca queda negativo).
// Lo comparten la caja (cobrarVenta) y el webhook de MercadoPago.
export async function descontarStock(items: { productoId: number; cantidad: number }[]) {
  for (const it of items) {
    await db
      .update(productos)
      .set({ stock: sql`max(0, ${productos.stock} - ${it.cantidad})` })
      .where(eq(productos.id, it.productoId));
  }
}
