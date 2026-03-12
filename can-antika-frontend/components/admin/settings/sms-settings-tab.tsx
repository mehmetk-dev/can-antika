import { Field } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function SmsSettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                <input
                    type="checkbox"
                    id="smsEnabled"
                    checked={settings.smsEnabled}
                    onChange={(e) => onChange("smsEnabled", e.target.checked)}
                    className="h-5 w-5 accent-[#14452F]"
                />
                <div>
                    <label htmlFor="smsEnabled" className="text-sm font-semibold cursor-pointer">
                        SMS Gönderimi {settings.smsEnabled ? "🟢 Aktif" : "🔴 Kapalı"}
                    </label>
                    <p className="text-xs text-muted-foreground">Sipariş ve bildirim SMS&apos;leri</p>
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium">SMS Sağlayıcı</label>
                    <select
                        className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                        value={settings.smsProvider ?? ""}
                        onChange={(e) => onChange("smsProvider", e.target.value)}
                    >
                        <option value="">Seçin</option>
                        <option value="netgsm">NetGSM</option>
                        <option value="iletimerkezi">İleti Merkezi</option>
                        <option value="mutlucell">Mutlucell</option>
                    </select>
                </div>
                <Field label="Gönderen Adı" value={settings.smsSenderName} onChange={(v) => onChange("smsSenderName", v)} />
                <Field label="API Key" value={settings.smsApiKey} onChange={(v) => onChange("smsApiKey", v)} />
                <Field label="API Secret" value={settings.smsApiSecret} onChange={(v) => onChange("smsApiSecret", v)} type="password" />
            </div>
        </div>
    )
}
