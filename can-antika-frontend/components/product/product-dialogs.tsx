"use client"

import { useState } from "react"
import { CreditCard, MessageCircle, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { contactApi, supportTicketApi } from "@/lib/api"
import type { ProductResponse } from "@/lib/types"

interface ProductDialogsProps {
    product: ProductResponse
    className?: string
}

export function PurchaseDialog({ product, className = "" }: ProductDialogsProps) {
    const { isAuthenticated } = useAuth()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [note, setNote] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !phone.trim()) {
            toast.error("Ad Soyad ve Telefon alanları zorunludur")
            return
        }
        setSubmitting(true)
        try {
            await supportTicketApi.create({
                subject: `Satın Alma Talebi: ${product.title}`,
                message: `Ad Soyad: ${name}\nTelefon: ${phone}\nÜrün: ${product.title} (CAN-${product.id.toString().padStart(4, "0")})\nFiyat: ₺${(product.price ?? 0).toLocaleString("tr-TR")}${note ? `\nNot: ${note}` : ""}`,
            })
            toast.success("Satın alma talebiniz alındı, en kısa sürede sizi arayacağız")
            setIsOpen(false)
            setName("")
            setPhone("")
            setNote("")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Talep gönderilemedi")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (open && !isAuthenticated) {
                toast.error("Satın alma talebi için giriş yapmalısınız")
                router.push("/giris")
                return
            }
            setIsOpen(open)
        }}>
            <button
                className={`inline-flex min-h-11 w-full max-w-full items-center justify-center gap-2 whitespace-normal break-words rounded-md border border-[#d4af37]/50 bg-[#d4af37]/15 px-3 py-2 text-center text-sm font-medium text-[#6f4c1f] shadow-sm transition-colors hover:bg-[#d4af37]/25 ${className}`}
                onClick={() => {
                    if (!isAuthenticated) {
                        toast.error("Satın alma talebi için giriş yapmalısınız")
                        router.push("/giris")
                        return
                    }
                    setIsOpen(true)
                }}
            >
                <CreditCard className="h-4 w-4" />
                Satın Al
            </button>
            <DialogContent className="sm:max-w-md bg-background">
                <DialogHeader>
                    <DialogTitle className="font-serif">Satın Alma Talebi</DialogTitle>
                    <DialogDescription>
                        Bu ürünü satın almak için bilgilerinizi bırakın, size ulaşalım.
                    </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                    <div className="rounded-lg bg-muted/50 p-4">
                        <p className="font-serif font-medium text-foreground">{product.title}</p>
                        <p className="text-lg font-semibold text-primary mt-1">
                            ₺{(product.price ?? 0).toLocaleString("tr-TR")}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="purchase-name">Ad Soyad *</Label>
                        <Input id="purchase-name" placeholder="Adınız Soyadınız" className="bg-muted/50" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="purchase-phone">Telefon *</Label>
                        <Input id="purchase-phone" type="tel" placeholder="05XX XXX XX XX" className="bg-muted/50" value={phone} onChange={e => setPhone(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="purchase-note">Not (Opsiyonel)</Label>
                        <Textarea id="purchase-note" placeholder="Varsa eklemek istediğiniz not..." rows={3} className="bg-muted/50" value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={submitting}>
                        {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gönderiliyor...</> : "Satın Alma Talebini Gönder"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function ContactDialog({ product, className = "" }: ProductDialogsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !email.trim() || !message.trim()) {
            toast.error("Ad Soyad, E-posta ve Mesaj alanları zorunludur")
            return
        }
        setSubmitting(true)
        try {
            await contactApi.submit({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
                subject: `Ürün Sorusu: ${product.title}`,
                message: `Ürün: ${product.title} (CAN-${product.id.toString().padStart(4, "0")})\nMesaj: ${message.trim()}`,
            })
            toast.success("Mesajınız iletildi, en kısa sürede dönüş yapacağız")
            setIsOpen(false)
            setName("")
            setEmail("")
            setPhone("")
            setMessage("")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Mesaj gönderilemedi")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <button
                className={`inline-flex min-h-11 w-full max-w-full items-center justify-center gap-2 whitespace-normal break-words rounded-md border border-primary/30 bg-background px-3 py-2 text-center text-sm font-medium text-primary shadow-sm transition-colors hover:bg-primary/5 ${className}`}
                onClick={() => setIsOpen(true)}
            >
                <MessageCircle className="h-4 w-4" />
                İletişime Geç
            </button>
            <DialogContent className="sm:max-w-md bg-background">
                <DialogHeader>
                    <DialogTitle className="font-serif">Ürün Hakkında Soru Sorun</DialogTitle>
                    <DialogDescription>
                        Bu ürün hakkında soru sormak veya teklif vermek için formu doldurun.
                    </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                    <div className="rounded-lg bg-muted/50 p-4">
                        <p className="font-serif font-medium text-foreground">{product.title}</p>
                        <p className="text-sm text-muted-foreground">Envanter: CAN-{product.id.toString().padStart(4, "0")}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact-name">Ad Soyad *</Label>
                        <Input id="contact-name" placeholder="Adınız Soyadınız" className="bg-muted/50" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact-email">E-posta *</Label>
                        <Input id="contact-email" type="email" placeholder="ornek@email.com" className="bg-muted/50" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact-phone">Telefon</Label>
                        <Input id="contact-phone" type="tel" placeholder="05XX XXX XX XX" className="bg-muted/50" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact-message">Mesajınız *</Label>
                        <Textarea id="contact-message" placeholder="Ürün hakkında sormak istediğiniz..." rows={4} className="bg-muted/50" value={message} onChange={e => setMessage(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={submitting}>
                        {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gönderiliyor...</> : "Mesaj Gönder"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
