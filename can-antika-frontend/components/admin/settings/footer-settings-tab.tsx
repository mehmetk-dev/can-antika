import { Field, TextareaField } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function FooterSettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <TextareaField label="Footer Hakkında Metni" value={settings.footerAbout} onChange={(v) => onChange("footerAbout", v)} rows={3} />
            <Field label="Copyright Metni" value={settings.footerCopyright} onChange={(v) => onChange("footerCopyright", v)} />
        </div>
    )
}
