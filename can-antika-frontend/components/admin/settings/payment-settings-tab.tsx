import { Field, Toggle } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function PaymentSettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-3">Ödeme Yöntemleri</h3>
                <div className="space-y-2">
                    <Toggle label="Kredi Kartı" checked={settings.creditCardEnabled} onChange={(v) => onChange("creditCardEnabled", v)} desc="Sanal POS ile online ödeme" />
                    <Toggle label="Havale / EFT" checked={settings.bankTransferEnabled} onChange={(v) => onChange("bankTransferEnabled", v)} desc="Banka havalesi ile ödeme" />
                    <Toggle label="Kapıda Ödeme" checked={settings.cashOnDeliveryEnabled} onChange={(v) => onChange("cashOnDeliveryEnabled", v)} desc="Teslimat anı nakit veya kart" />
                </div>
            </div>

            <hr className="border-border/50" />

            <div>
                <h3 className="text-sm font-semibold mb-3">Sanal POS Ayarları</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Ödeme Sağlayıcı</label>
                        <select
                            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                            value={settings.paymentProvider ?? ""}
                            onChange={(e) => onChange("paymentProvider", e.target.value)}
                        >
                            <option value="">Seçin</option>
                            <option value="iyzico">iyzico</option>
                            <option value="paytr">PayTR</option>
                            <option value="param">Param</option>
                            <option value="stripe">Stripe</option>
                        </select>
                    </div>
                    <Field label="Merchant ID" value={settings.paymentMerchantId} onChange={(v) => onChange("paymentMerchantId", v)} />
                    <Field label="API Key" value={settings.paymentApiKey} onChange={(v) => onChange("paymentApiKey", v)} />
                    <Field label="Secret Key" value={settings.paymentSecretKey} onChange={(v) => onChange("paymentSecretKey", v)} type="password" />
                </div>
            </div>

            <hr className="border-border/50" />

            <div className="flex items-center gap-3 p-4 rounded-lg border bg-amber-500/10 border-amber-500/20">
                <input
                    type="checkbox"
                    id="testMode"
                    checked={settings.paymentTestMode}
                    onChange={(e) => onChange("paymentTestMode", e.target.checked)}
                    className="h-5 w-5 accent-[#14452F]"
                />
                <div>
                    <label htmlFor="testMode" className="text-sm font-semibold cursor-pointer">
                        Test Modu {settings.paymentTestMode ? "🟡 Aktif (Gerçek ödeme alınmıyor)" : "🟢 Kapalı (Canlı mod)"}
                    </label>
                    <p className="text-xs text-muted-foreground">Canlıya almadan önce test modunu kapatın</p>
                </div>
            </div>
        </div>
    )
}
