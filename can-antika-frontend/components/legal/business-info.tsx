interface BusinessInfoProps {
  variant?: "full" | "contact" | "phone-only"
}

export function BusinessInfo({ variant = "full" }: BusinessInfoProps) {
  if (variant === "phone-only") {
    return (
      <ul className="list-disc space-y-1 pl-6 leading-7">
        <li>Telefon: +90 507 687 92 15</li>
        <li>E-posta: destek@canantika.com</li>
      </ul>
    )
  }

  return (
    <ul className="list-disc space-y-1 pl-6 leading-7">
      <li>Mesut Can (Şahıs İşletmesi)</li>
      {variant === "full" && (
        <>
          <li>Marka: Can Antika</li>
          <li>Faaliyet Konusu: Antika Perakende Ticareti</li>
          <li>İnternet Sitesi: www.canantika.com</li>
        </>
      )}
      <li>Adres: Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li>
      <li>Telefon: +90 507 687 92 15</li>
      <li>E-posta: destek@canantika.com</li>
    </ul>
  )
}
