import type { LegalDocumentSection } from "@/lib/legal/legal-documents"

interface LegalDocumentContentProps {
  sections: LegalDocumentSection[]
  sectionClassName?: string
  headingClassName?: string
  paragraphClassName?: string
}

export function LegalDocumentContent({
  sections,
  sectionClassName = "mt-8 space-y-3",
  headingClassName = "text-xl font-semibold",
  paragraphClassName = "leading-7",
}: LegalDocumentContentProps) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading} className={sectionClassName}>
          <h2 className={headingClassName}>{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className={paragraphClassName}>
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </>
  )
}
