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
