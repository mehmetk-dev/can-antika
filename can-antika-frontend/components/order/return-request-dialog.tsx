import { useState } from "react"
import { RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { orderReturnApi } from "@/lib/api"
import { toast } from "sonner"

interface ReturnRequestDialogProps {
    orderId: number
}

export function ReturnRequestDialog({ orderId }: ReturnRequestDialogProps) {
    const [returnReason, setReturnReason] = useState("")
    const [isReturning, setIsReturning] = useState(false)
    const [open, setOpen] = useState(false)

    const handleSubmit = async () => {
        setIsReturning(true)
        try {
            await orderReturnApi.createReturn({ orderId, reason: returnReason })
            toast.success("İade talebiniz oluşturuldu")
            setOpen(false)
            setReturnReason("")
        } catch {
            toast.error("İade talebi oluşturulamadı")
        } finally {
            setIsReturning(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                    <RotateCcw className="h-4 w-4" />
                    İade Talebi Oluştur
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background">
                <DialogHeader>
                    <DialogTitle className="font-serif">İade Talebi</DialogTitle>
                    <DialogDescription>
                        Sipariş #{orderId} için iade talebinizi oluşturun.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <Textarea
                        placeholder="İade nedeninizi açıklayın..."
                        rows={4}
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                    />
                    <Button
                        className="w-full"
                        disabled={isReturning || !returnReason.trim()}
                        onClick={handleSubmit}
                    >
                        {isReturning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                        {isReturning ? "Gönderiliyor..." : "Talebi Gönder"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
