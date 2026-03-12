import type { SiteSettingsResponse } from "@/lib/types"

export interface SettingsTabProps {
    settings: SiteSettingsResponse
    onChange: (key: string, value: unknown) => void
}
