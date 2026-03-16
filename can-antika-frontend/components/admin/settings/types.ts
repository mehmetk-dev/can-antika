import type { SiteSettingsResponse } from "@/lib/types"

export interface SettingsTabProps {
    settings: SiteSettingsResponse
    onChange: (key: string, value: unknown) => void
    onMaintenanceModeChange?: (next: boolean) => Promise<void>
    maintenanceSaving?: boolean
}
