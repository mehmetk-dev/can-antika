import { Field } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function ShippingSettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <Field label="Standart Teslimat Açıklaması" value={settings.standardDelivery} onChange={(v) => onChange("standardDelivery", v)} placeholder="Örn: 3-5 iş günü" />
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ücretsiz Kargo Alt Limiti (₺)" value={settings.freeShippingMin} onChange={(v) => onChange("freeShippingMin", Number(v))} type="number" />
                <Field label="Kargo Süresi (Gün)" value={settings.shippingDurationDays} onChange={(v) => onChange("shippingDurationDays", Number(v))} type="number" />
            </div>
        </div>
    )
}
