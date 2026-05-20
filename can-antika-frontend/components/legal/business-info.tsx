interface BusinessInfoProps {
  variant?: "full" | "contact" | "phone-only"
}

export const LEGAL_BUSINESS_INFO = {
  ownerName: "Mesut Can",
  companyName: "Mesut Can (Şahıs İşletmesi)",
  brandName: "Can Antika",
  businessType: "Antika Perakende Ticareti",
  activityCode: "477901",
  taxType: "Yıllık Gelir Vergisi",
  taxOffice: "Beyoğlu",
  taxId: "62857430140",
  startDate: "01.03.2021",
  website: "www.canantika.com",
  address: "Hüseyinağa Mah. Meşrutiyet Cad. Avrupa Pasajı No: 8 İç Kapı No: 7 Beyoğlu / İstanbul",
  phone: "+90 507 687 92 15",
  email: "destek@canantika.com",
}

export function BusinessInfo({ variant = "full" }: BusinessInfoProps) {
  if (variant === "phone-only") {
    return (
      <ul className="list-disc space-y-1 pl-6 leading-7">
        <li>Telefon: {LEGAL_BUSINESS_INFO.phone}</li>
        <li>E-posta: {LEGAL_BUSINESS_INFO.email}</li>
      </ul>
    )
  }

  return (
    <ul className="list-disc space-y-1 pl-6 leading-7">
      <li>{LEGAL_BUSINESS_INFO.companyName}</li>
      {variant === "full" && (
        <>
          <li>Marka: {LEGAL_BUSINESS_INFO.brandName}</li>
          <li>Faaliyet Konusu: {LEGAL_BUSINESS_INFO.businessType}</li>
          <li>Faaliyet Kodu: {LEGAL_BUSINESS_INFO.activityCode}</li>
          <li>Vergi Türü: {LEGAL_BUSINESS_INFO.taxType}</li>
          <li>İşe Başlama Tarihi: {LEGAL_BUSINESS_INFO.startDate}</li>
          <li>İnternet Sitesi: {LEGAL_BUSINESS_INFO.website}</li>
        </>
      )}
      <li>Vergi Dairesi: {LEGAL_BUSINESS_INFO.taxOffice}</li>
      <li>Vergi Kimlik No: {LEGAL_BUSINESS_INFO.taxId}</li>
      <li>Adres: {LEGAL_BUSINESS_INFO.address}</li>
      <li>Telefon: {LEGAL_BUSINESS_INFO.phone}</li>
      <li>E-posta: {LEGAL_BUSINESS_INFO.email}</li>
    </ul>
  )
}
