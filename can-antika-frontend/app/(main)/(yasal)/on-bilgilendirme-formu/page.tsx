import type { Metadata } from "next"
import Link from "next/link"

import { LegalDocumentContent } from "@/components/legal/legal-document-content"
import { LEGAL_DOCUMENTS_UPDATED_AT, PRE_INFORMATION_SECTIONS } from "@/lib/legal/legal-documents"

export const metadata: Metadata = {
  title: "Ön Bilgilendirme Formu",
  description: "Can Antika Ön Bilgilendirme Formu.",
}

export default function PreInformationFormPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 md:py-14">
        <article className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Ön Bilgilendirme Formu</h1>
          <p className="mt-3 text-sm text-muted-foreground">Son Güncelleme: {LEGAL_DOCUMENTS_UPDATED_AT}</p>

          <LegalDocumentContent sections={PRE_INFORMATION_SECTIONS} />

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">İlgili Hukuki Metinler</h2>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li><Link href="/mesafeli-satis-sozlesmesi" className="underline-offset-4 hover:underline">Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link href="/teslimat" className="underline-offset-4 hover:underline">Teslimat / Kargo Politikası</Link></li>
              <li><Link href="/iade" className="underline-offset-4 hover:underline">İade / İptal / Cayma Politikası</Link></li>
              <li><Link href="/kvkk" className="underline-offset-4 hover:underline">KVKK Aydınlatma Metni</Link></li>
              <li><Link href="/gizlilik" className="underline-offset-4 hover:underline">Gizlilik Politikası</Link></li>
              <li><Link href="/cerezler" className="underline-offset-4 hover:underline">Çerez Politikası</Link></li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  )
}
