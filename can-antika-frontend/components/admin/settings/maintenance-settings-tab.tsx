import { TextareaField } from "@/components/ui/form-fields"
import type { SettingsTabProps } from "./types"

export default function MaintenanceSettingsTab({
  settings,
  onChange,
  onMaintenanceModeChange,
  maintenanceSaving,
}: SettingsTabProps) {
  const handleToggle = async (nextChecked: boolean) => {
    if (nextChecked && !confirm("Bakım modunu açmak istediğinize emin misiniz? Ziyaretçiler siteye erişemeyecek.")) {
      return
    }
    if (!nextChecked && !confirm("Bakım modunu kapatmak istediğinize emin misiniz? Site tekrar ziyaretçilere açılacak.")) {
      return
    }

    if (onMaintenanceModeChange) {
      await onMaintenanceModeChange(nextChecked)
      return
    }

    onChange("maintenanceMode", nextChecked)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
        <input
          type="checkbox"
          id="maintenanceMode"
          checked={settings.maintenanceMode}
          onChange={(e) => {
            void handleToggle(e.target.checked)
          }}
          disabled={maintenanceSaving}
          className="h-5 w-5 accent-[#14452F]"
        />
        <div>
          <label htmlFor="maintenanceMode" className="cursor-pointer text-sm font-semibold">
            Bakım Modu {settings.maintenanceMode ? "Aktif" : "Kapalı"}
          </label>
          <p className="text-xs text-muted-foreground">Aktifken ziyaretçiler siteye giremez</p>
          {maintenanceSaving && <p className="mt-1 text-xs text-muted-foreground">Bakım modu güncelleniyor...</p>}
        </div>
      </div>
      <TextareaField
        label="Bakım Mesajı"
        value={settings.maintenanceMessage}
        onChange={(v) => onChange("maintenanceMessage", v)}
        rows={3}
      />
    </div>
  )
}
