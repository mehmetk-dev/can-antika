import { Field, TextareaField } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function StoreSettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <Field label="Mağaza Adı" value={settings.storeName} onChange={(v) => onChange("storeName", v)} />
            <Field label="İş Türü" value={settings.businessType} onChange={(v) => onChange("businessType", v)} placeholder="Antika, Koleksiyon..." />
            <TextareaField label="Mağaza Açıklaması" value={settings.storeDescription} onChange={(v) => onChange("storeDescription", v)} rows={3} />
        </div>
    )
}
