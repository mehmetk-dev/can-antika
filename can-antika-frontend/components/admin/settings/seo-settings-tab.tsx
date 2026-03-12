import { Field, TextareaField } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function SeoSettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <Field label="Meta Başlık (Title)" value={settings.metaTitle} onChange={(v) => onChange("metaTitle", v)} />
            <TextareaField label="Meta Açıklama (Description)" value={settings.metaDescription} onChange={(v) => onChange("metaDescription", v)} rows={2} />
            <Field label="Anahtar Kelimeler (virgülle ayırın)" value={settings.metaKeywords} onChange={(v) => onChange("metaKeywords", v)} />
            <hr className="border-border/50 my-2" />
            <Field label="Google Analytics ID" value={settings.googleAnalyticsId} onChange={(v) => onChange("googleAnalyticsId", v)} placeholder="G-XXXXXXXXXX" />
            <Field label="Facebook Pixel ID" value={settings.facebookPixelId} onChange={(v) => onChange("facebookPixelId", v)} />
            <TextareaField label="Özel Head Script'ler" value={settings.customHeadScripts} onChange={(v) => onChange("customHeadScripts", v)} rows={4} placeholder="<script>...</script>" className="font-mono text-sm" />
        </div>
    )
}
