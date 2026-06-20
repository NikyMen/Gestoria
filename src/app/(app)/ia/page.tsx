import { requireAcceso } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { AsistenteIA } from "@/components/asistente-ia";

export default async function IAPage() {
  await requireAcceso("ia");
  return (
    <>
      <PageHeader
        title="Asistente IA"
        subtitle="Consultas rápidas del negocio, descripciones de productos y publicaciones para redes."
      />
      <AsistenteIA />
    </>
  );
}
