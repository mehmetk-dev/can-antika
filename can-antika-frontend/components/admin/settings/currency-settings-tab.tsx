import { Field } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function CurrencySettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Para Birimi Kodu" value={settings.currency} onChange={(v) => onChange("currency", v)} placeholder="TRY" />
                <Field label="Sembol" value={settings.currencySymbol} onChange={(v) => onChange("currencySymbol", v)} placeholder="₺" />
            </div>
        </div>
    )
}
