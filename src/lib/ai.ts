import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001"; // rápido y económico para contenido comercial

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta ANTHROPIC_API_KEY. Copiá .env.example a .env y agregá tu clave de Anthropic."
    );
  }
  return new Anthropic({ apiKey });
}

async function ask(system: string, prompt: string, maxTokens = 1024): Promise<string> {
  const client = getClient();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export async function generarDescripcionProducto(input: {
  nombre: string;
  categoria?: string;
  detalles?: string;
}): Promise<string> {
  const system =
    "Sos un copywriter experto en e-commerce. Escribís descripciones de producto persuasivas, " +
    "claras y optimizadas para vender en internet (español rioplatense neutro). " +
    "Devolvés solo la descripción, sin títulos ni comillas.";
  const prompt =
    `Producto: ${input.nombre}\n` +
    `Categoría: ${input.categoria ?? "General"}\n` +
    `Detalles: ${input.detalles || "(sin detalles adicionales)"}\n\n` +
    "Escribí una descripción de venta de 2-3 párrafos cortos, con beneficios concretos " +
    "y un cierre que invite a la compra.";
  return ask(system, prompt);
}

export async function generarPublicacionRedes(input: {
  nombre: string;
  red: "instagram" | "facebook" | "tiktok" | "whatsapp";
  promo?: string;
}): Promise<string> {
  const system =
    "Sos community manager de un comercio. Creás publicaciones atractivas para redes sociales " +
    "con gancho, emojis con criterio, y un llamado a la acción. Español rioplatense neutro.";
  const prompt =
    `Producto: ${input.nombre}\n` +
    `Red social: ${input.red}\n` +
    `Promoción/ángulo: ${input.promo || "destacar el producto"}\n\n` +
    "Generá una publicación lista para copiar y pegar, con 5-8 hashtags relevantes al final.";
  return ask(system, prompt);
}

// Chat con memoria: se le manda la conversación entera para que pueda
// encadenar preguntas ("¿y de esos cuál conviene reponer primero?").
export async function chatNegocio(input: {
  mensajes: { rol: string; texto: string }[];
  contexto: string;
}): Promise<string> {
  const client = getClient();
  const system =
    "Sos un asistente de negocios integrado a un ERP argentino. Respondés sobre el comercio " +
    "usando EXCLUSIVAMENTE los datos del contexto que sigue. Sos breve, directo y usás números " +
    "concretos. Si el dato no está en el contexto, lo decís claramente en vez de inventarlo. " +
    "Español rioplatense neutro.\n\nDATOS DEL NEGOCIO:\n" +
    input.contexto;

  const messages = input.mensajes
    .filter((m) => m.texto.trim())
    .map((m) => ({
      role: m.rol === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.texto,
    }));
  if (messages.length === 0) throw new Error("No hay ningún mensaje para responder.");

  const res = await client.messages.create({ model: MODEL, max_tokens: 900, system, messages });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// Transcripción de la foto de un remito/factura de compra.
export async function transcribirImagen(input: {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}): Promise<string> {
  const client = getClient();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system:
      "Transcribís remitos y facturas de compra de un comercio. Devolvés texto plano legible, " +
      "sin markdown ni comentarios tuyos. Si un dato no se lee, escribís (ilegible).",
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: input.mediaType, data: input.base64 } },
          {
            type: "text",
            text:
              "Transcribí este comprobante de compra. Incluí, si están: proveedor, número y fecha " +
              "del comprobante, y el listado de ítems con cantidad, precio unitario y subtotal, " +
              "uno por línea. Cerrá con el TOTAL.",
          },
        ],
      },
    ],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export async function consultaNegocio(input: {
  pregunta: string;
  contexto: string;
}): Promise<string> {
  const system =
    "Sos un asistente de negocios integrado a un ERP. Respondés preguntas sobre el comercio " +
    "usando EXCLUSIVAMENTE los datos del contexto. Sos breve, directo y usás números concretos. " +
    "Si el dato no está en el contexto, lo decís claramente.";
  const prompt = `DATOS DEL NEGOCIO:\n${input.contexto}\n\nPREGUNTA: ${input.pregunta}`;
  return ask(system, prompt, 700);
}
