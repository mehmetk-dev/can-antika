import type { Metadata } from "next";
import { LegalDocumentContent } from "@/components/legal/legal-document-content";
import { LEGAL_DOCUMENTS_UPDATED_AT, RETURN_POLICY_SECTIONS } from "@/lib/legal/legal-documents";

export const metadata: Metadata = {
  title: "İade / İptal / Cayma Politikası",
  description: "Can Antika İade / İptal / Cayma Politikası.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 md:py-14">
        <article className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">İade / İptal / Cayma Politikası</h1>
          <p className="mt-3 text-sm text-muted-foreground">Son Güncelleme: {LEGAL_DOCUMENTS_UPDATED_AT}</p>

          <p className="mt-6 leading-7">
            Can Antika olarak müşteri memnuniyetine önem veriyoruz. Bu politika, www.canantika.com üzerinden satın
            alınan ürünlere ilişkin cayma hakkı, iade, iptal ve ayıplı ürün süreçlerini düzenlemek amacıyla
            hazırlanmıştır.
          </p>

          <LegalDocumentContent sections={RETURN_POLICY_SECTIONS} />
        </article>
      </main>
    </div>
  );
}
