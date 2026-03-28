export function TrustIndicators() {
  const indicators = [
    {
      icon: (
        <svg viewBox="0 0 48 48" className="h-full w-full">
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="2 2" />
          <path d="M24,12 L24,8 M24,40 L24,36 M12,24 L8,24 M40,24 L36,24" stroke="currentColor" strokeWidth="1.5" />
          <path d="M24,16 L24,24 L30,24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="24" cy="24" r="3" fill="currentColor" />
          <circle cx="24" cy="8" r="2" fill="currentColor" />
        </svg>
      ),
      title: "Uzman Değerlendirme",
      description: "Her ürün uzman ekibimiz tarafından titizlikle incelenir.",
    },
    {
      icon: (
        <svg viewBox="0 0 48 48" className="h-full w-full">
          <rect x="8" y="20" width="32" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M8,26 L40,26" stroke="currentColor" strokeWidth="1" />
          <circle cx="16" cy="30" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="32" cy="30" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M14,20 L14,14 Q14,10 24,10 T34,14 L34,20" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="24" cy="10" r="2" fill="currentColor" />
        </svg>
      ),
      title: "Güvenli Teslimat",
      description: "Özel paketleme ve sigortalı kargo ile güvenle ulaşır.",
    },
    {
      icon: (
        <svg viewBox="0 0 48 48" className="h-full w-full">
          <path
            d="M24,6 L28,18 L40,18 L30,26 L34,38 L24,30 L14,38 L18,26 L8,18 L20,18 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="24" cy="22" r="6" stroke="currentColor" strokeWidth="1" fill="none" />
          <circle cx="24" cy="22" r="2" fill="currentColor" />
        </svg>
      ),
      title: "1990'dan Beri",
      description: "34 yıllık deneyim ve binlerce mutlu koleksiyoner.",
    },
    {
      icon: (
        <svg viewBox="0 0 48 48" className="h-full w-full">
          <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path
            d="M16,24 L22,30 L32,18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="24" cy="6" r="2" fill="currentColor" />
          <circle cx="24" cy="42" r="2" fill="currentColor" />
          <circle cx="6" cy="24" r="2" fill="currentColor" />
          <circle cx="42" cy="24" r="2" fill="currentColor" />
        </svg>
      ),
      title: "İade Garantisi",
      description: "14 gün içinde koşulsuz iade garantisi.",
    },
  ]

  return (
    <section className="relative border-y border-amber-200 bg-gradient-to-b from-amber-50 to-white py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="trust-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle
              cx="20"
              cy="20"
              r="15"
              stroke="currentColor"
              strokeWidth="0.5"
              fill="none"
              className="text-amber-900"
            />
            <circle
              cx="20"
              cy="20"
              r="10"
              stroke="currentColor"
              strokeWidth="0.3"
              fill="none"
              className="text-amber-900"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#trust-pattern)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {indicators.map((indicator, i) => (
            <div key={indicator.title} className="group relative text-center">
              {/* Dekoratif çerçeve */}
              <div className="absolute -inset-4 rounded-lg border border-amber-200/50 opacity-0 transition-opacity group-hover:opacity-100" />

              {/* İkon */}
              <div className="relative mx-auto h-20 w-20 text-amber-700 transition-colors group-hover:text-amber-600">
                <div className="absolute inset-0 rounded-full border border-amber-300/50" />
                <div className="absolute inset-2 rounded-full border border-dashed border-amber-400/30" />
                <div className="absolute inset-4 flex items-center justify-center">{indicator.icon}</div>
              </div>

              <h3 className="mt-6 font-serif text-xl font-semibold text-amber-950">{indicator.title}</h3>
              <div className="mx-auto mt-2 h-px w-12 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <p className="mt-3 text-sm leading-relaxed text-amber-800/70">{indicator.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
