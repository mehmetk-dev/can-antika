import { Field } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function SmtpSettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SMTP Host" value={settings.smtpHost} onChange={(v) => onChange("smtpHost", v)} placeholder="smtp.gmail.com" />
                <Field label="SMTP Port" value={settings.smtpPort} onChange={(v) => onChange("smtpPort", Number(v))} type="number" placeholder="587" />
                <Field label="Kullanıcı Adı" value={settings.smtpUsername} onChange={(v) => onChange("smtpUsername", v)} />
                <Field label="Şifre" value={settings.smtpPassword} onChange={(v) => onChange("smtpPassword", v)} type="password" />
                <Field label="Gönderen E-posta" value={settings.smtpFromEmail} onChange={(v) => onChange("smtpFromEmail", v)} placeholder="destek@canantika.com" />
                <Field label="Gönderen Adı" value={settings.smtpFromName} onChange={(v) => onChange("smtpFromName", v)} placeholder="Can Antika" />
            </div>
        </div>
    )
}
