import { Field } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function CompanySettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <Field label="Firma Adı" value={settings.companyName} onChange={(v) => onChange("companyName", v)} />
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Vergi No" value={settings.taxId} onChange={(v) => onChange("taxId", v)} />
                <Field label="Vergi Dairesi" value={settings.taxOffice} onChange={(v) => onChange("taxOffice", v)} />
            </div>
        </div>
    )
}
