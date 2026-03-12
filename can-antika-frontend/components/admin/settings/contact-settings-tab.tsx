import { Field, TextareaField } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function ContactSettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Telefon" value={settings.phone} onChange={(v) => onChange("phone", v)} />
                <Field label="E-posta" value={settings.email} onChange={(v) => onChange("email", v)} />
                <Field label="WhatsApp" value={settings.whatsapp} onChange={(v) => onChange("whatsapp", v)} />
                <Field label="Web Sitesi" value={settings.website} onChange={(v) => onChange("website", v)} disabled hint="Web sitesi adresi sistem tarafından yönetilir" />
            </div>
            <TextareaField label="Adres" value={settings.address} onChange={(v) => onChange("address", v)} rows={2} />
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hafta İçi Çalışma Saatleri" value={settings.weekdayHours} onChange={(v) => onChange("weekdayHours", v)} placeholder="09:00 - 18:00" />
                <Field label="Cumartesi Çalışma Saatleri" value={settings.saturdayHours} onChange={(v) => onChange("saturdayHours", v)} placeholder="10:00 - 14:00" />
            </div>
        </div>
    )
}
