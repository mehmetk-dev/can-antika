import { Field } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function SocialSettingsTab({ settings, onChange }: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Facebook" value={settings.facebook} onChange={(v) => onChange("facebook", v)} placeholder="https://facebook.com/..." />
                <Field label="Instagram" value={settings.instagram} onChange={(v) => onChange("instagram", v)} placeholder="https://instagram.com/..." />
                <Field label="Twitter / X" value={settings.twitter} onChange={(v) => onChange("twitter", v)} placeholder="https://x.com/..." />
                <Field label="YouTube" value={settings.youtube} onChange={(v) => onChange("youtube", v)} placeholder="https://youtube.com/..." />
                <Field label="TikTok" value={settings.tiktok} onChange={(v) => onChange("tiktok", v)} placeholder="https://tiktok.com/..." />
            </div>
        </div>
    )
}
