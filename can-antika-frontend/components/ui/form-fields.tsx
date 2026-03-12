import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/* ───────────────────────── Field ───────────────────────── */

interface FieldProps {
    label: string
    value: unknown
    onChange: (v: string) => void
    type?: string
    placeholder?: string
    disabled?: boolean
    hint?: string
}

export function Field({ label, value, onChange, type = "text", placeholder, disabled, hint }: FieldProps) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">{label}</label>
                {disabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                        Değiştirilemez
                    </span>
                )}
            </div>
            <Input
                type={type}
                value={(value as string) ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    "bg-muted/30 border-border/60 focus-visible:ring-[#14452F]/30",
                    disabled && "opacity-60 cursor-not-allowed bg-muted/60"
                )}
            />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    )
}

/* ───────────────────────── TextareaField ───────────────────────── */

interface TextareaFieldProps {
    label: string
    value: unknown
    onChange: (v: string) => void
    rows?: number
    placeholder?: string
    className?: string
}

export function TextareaField({ label, value, onChange, rows = 3, placeholder, className }: TextareaFieldProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{label}</label>
            <Textarea
                rows={rows}
                value={(value as string) ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn("bg-muted/30 border-border/60 focus-visible:ring-[#14452F]/30", className)}
            />
        </div>
    )
}

/* ───────────────────────── Toggle ───────────────────────── */

interface ToggleProps {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
    desc: string
}

export function Toggle({ label, checked, onChange, desc }: ToggleProps) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20 transition-colors hover:bg-muted/40">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 accent-[#14452F]"
            />
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
        </div>
    )
}
