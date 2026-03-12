import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuantitySelectorProps {
    max: number
    value: number
    onChange: (value: number | ((prev: number) => number)) => void
    disabled?: boolean
}

export function QuantitySelector({ max, value, onChange, disabled }: QuantitySelectorProps) {
    return (
        <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground" htmlFor="quantity-selector">Adet:</label>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={value <= 1 || disabled}
                    onClick={() => onChange(q => Math.max(1, q - 1))}
                    aria-label="Azalt"
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <input
                    id="quantity-selector"
                    type="number"
                    min={1}
                    max={max}
                    value={value}
                    onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val)) {
                            onChange(Math.max(1, Math.min(max, val)))
                        }
                    }}
                    disabled={disabled}
                    className="w-14 rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label="Miktar"
                />
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={value >= max || disabled}
                    onClick={() => onChange(q => Math.min(max, q + 1))}
                    aria-label="Arttır"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
