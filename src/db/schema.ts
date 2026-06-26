import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const now = sql`(strftime('%s','now'))`;

// ---------------------------------------------------------------------------
// Productos / Stock
// ---------------------------------------------------------------------------
export const productos = sqliteTable("productos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").default(""),
  categoria: text("categoria").default("General"),
  precioVenta: real("precio_venta").notNull().default(0),
  precioCompra: real("precio_compra").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  stockMinimo: integer("stock_minimo").notNull().default(5),
  imagen: text("imagen").default(""),
  // Tienda online
  publicado: integer("publicado", { mode: "boolean" }).notNull().default(false),
  descripcionWeb: text("descripcion_web").default(""),
  creadoEn: integer("creado_en", { mode: "timestamp" }).default(now),
});

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------
export const clientes = sqliteTable("clientes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  email: text("email").default(""),
  telefono: text("telefono").default(""),
  cuit: text("cuit").default(""),
  direccion: text("direccion").default(""),
  creadoEn: integer("creado_en", { mode: "timestamp" }).default(now),
});

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------
export const ventas = sqliteTable("ventas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clienteId: integer("cliente_id").references(() => clientes.id),
  total: real("total").notNull().default(0),
  estado: text("estado").notNull().default("completada"), // completada | pendiente | cancelada
  canal: text("canal").notNull().default("local"), // local | online
  medioPago: text("medio_pago").notNull().default("efectivo"), // efectivo | qr | tarjeta
  facturada: integer("facturada", { mode: "boolean" }).notNull().default(false),
  fecha: integer("fecha", { mode: "timestamp" }).default(now),
});

export const ventaItems = sqliteTable("venta_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ventaId: integer("venta_id").notNull().references(() => ventas.id),
  productoId: integer("producto_id").notNull().references(() => productos.id),
  cantidad: integer("cantidad").notNull().default(1),
  precioUnit: real("precio_unit").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Compras
// ---------------------------------------------------------------------------
export const compras = sqliteTable("compras", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  proveedor: text("proveedor").notNull().default(""),
  total: real("total").notNull().default(0),
  estado: text("estado").notNull().default("recibida"), // recibida | pendiente
  fecha: integer("fecha", { mode: "timestamp" }).default(now),
});

export const compraItems = sqliteTable("compra_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  compraId: integer("compra_id").notNull().references(() => compras.id),
  productoId: integer("producto_id").notNull().references(() => productos.id),
  cantidad: integer("cantidad").notNull().default(1),
  precioUnit: real("precio_unit").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Facturación
// ---------------------------------------------------------------------------
export const facturas = sqliteTable("facturas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  numero: text("numero").notNull(),
  ventaId: integer("venta_id").references(() => ventas.id),
  clienteId: integer("cliente_id").references(() => clientes.id),
  tipo: text("tipo").notNull().default("B"), // A | B | C
  subtotal: real("subtotal").notNull().default(0),
  iva: real("iva").notNull().default(0),
  total: real("total").notNull().default(0),
  estado: text("estado").notNull().default("emitida"), // emitida | pagada | anulada
  fecha: integer("fecha", { mode: "timestamp" }).default(now),
});

// ---------------------------------------------------------------------------
// Usuarios / Equipo (login + permisos)
// ---------------------------------------------------------------------------
export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  usuario: text("usuario").notNull().unique(), // handle de login
  email: text("email").notNull().default(""),
  passwordHash: text("password_hash").notNull().default(""), // scrypt: salt:hash
  rol: text("rol").notNull().default("miembro"), // admin | miembro
  permisos: text("permisos").notNull().default("[]"), // JSON: módulos permitidos
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creadoEn: integer("creado_en", { mode: "timestamp" }).default(now),
});

// ---------------------------------------------------------------------------
// WhatsApp — CRM Kanban
// ---------------------------------------------------------------------------
// Etapas = columnas del tablero kanban (Leads entrantes, Contactados, …)
export const waEtapas = sqliteTable("wa_etapas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  color: text("color").notNull().default("slate"), // clave de color del badge
  orden: integer("orden").notNull().default(0),
  // Etapa de "venta exitosa": mover una card aquí exige un presupuesto cargado.
  esExito: integer("es_exito", { mode: "boolean" }).notNull().default(false),
  creadoEn: integer("creado_en", { mode: "timestamp" }).default(now),
});

// Contactos = cada card del kanban (un usuario de WhatsApp)
export const waContactos = sqliteTable("wa_contactos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jid: text("jid").notNull().unique(), // 549111234567@s.whatsapp.net
  telefono: text("telefono").notNull().default(""),
  numeroLead: text("numero_lead").notNull().default(""), // nº de lead único (L-0001)
  nombre: text("nombre").notNull().default(""),
  avatar: text("avatar").default(""),
  email: text("email").notNull().default(""),
  notas: text("notas").notNull().default(""),
  responsableId: integer("responsable_id").references(() => usuarios.id),
  etapaId: integer("etapa_id").references(() => waEtapas.id),
  orden: integer("orden").notNull().default(0), // posición dentro de la columna
  ultimoMensaje: text("ultimo_mensaje").notNull().default(""),
  ultimoMensajeEn: integer("ultimo_mensaje_en", { mode: "timestamp" }).default(now),
  noLeidos: integer("no_leidos").notNull().default(0),
  creadoEn: integer("creado_en", { mode: "timestamp" }).default(now),
});

// Presupuestos = cotización con ítems del stock para un lead. Tener uno con
// total > 0 es requisito para mover la card a la etapa de "venta exitosa".
export const waPresupuestos = sqliteTable("wa_presupuestos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactoId: integer("contacto_id").notNull().references(() => waContactos.id),
  estado: text("estado").notNull().default("borrador"), // borrador | enviado | aprobado
  total: real("total").notNull().default(0),
  creadoEn: integer("creado_en", { mode: "timestamp" }).default(now),
});

export const waPresupuestoItems = sqliteTable("wa_presupuesto_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  presupuestoId: integer("presupuesto_id").notNull().references(() => waPresupuestos.id),
  productoId: integer("producto_id").references(() => productos.id),
  descripcion: text("descripcion").notNull().default(""), // snapshot del nombre
  cantidad: integer("cantidad").notNull().default(1),
  precioUnit: real("precio_unit").notNull().default(0),
});

// Mensajes = historial de chat por contacto
export const waMensajes = sqliteTable("wa_mensajes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactoId: integer("contacto_id").notNull().references(() => waContactos.id),
  waId: text("wa_id").default(""), // id del mensaje en WhatsApp (dedup)
  desdeMi: integer("desde_mi", { mode: "boolean" }).notNull().default(false),
  texto: text("texto").notNull().default(""),
  tipo: text("tipo").notNull().default("texto"), // texto | imagen | audio | video | documento | otro
  timestamp: integer("timestamp", { mode: "timestamp" }).default(now),
  creadoEn: integer("creado_en", { mode: "timestamp" }).default(now),
});

export type Producto = typeof productos.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Venta = typeof ventas.$inferSelect;
export type Compra = typeof compras.$inferSelect;
export type Factura = typeof facturas.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
export type WaEtapa = typeof waEtapas.$inferSelect;
export type WaContacto = typeof waContactos.$inferSelect;
export type WaMensaje = typeof waMensajes.$inferSelect;
export type WaPresupuesto = typeof waPresupuestos.$inferSelect;
export type WaPresupuestoItem = typeof waPresupuestoItems.$inferSelect;
