"use client"

import { useState } from "react"
import { Loader2, MessageSquare, Plus, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useSupportTickets } from "@/hooks/useSupportTickets"
import type { SupportTicketResponse } from "@/lib/types"
import { formatDateTR } from "@/lib/utils"

function SupportContent() {
    const { tickets, isLoading, isSending, createTicket } = useSupportTickets()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [selectedTicket, setSelectedTicket] = useState<SupportTicketResponse | null>(null)

    const handleCreate = async () => {
        const success = await createTicket(subject, message)
        if (success) {
            setSubject("")
            setMessage("")
            setIsCreateOpen(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Destek talepleri yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Destek</h1>
                    <p className="mt-2 text-muted-foreground">Destek taleplerinizi görüntüleyin ve yeni talep oluşturun</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Yeni Talep
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-background">
                        <DialogHeader>
                            <DialogTitle className="font-serif">Destek Talebi Oluştur</DialogTitle>
                            <DialogDescription>Sorununuzu veya isteğinizi bize bildirin.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                            <Input
                                placeholder="Konu"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                            <Textarea
                                placeholder="Mesajınızı yazın..."
                                rows={5}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <Button
                                className="w-full gap-2"
                                disabled={isSending || !subject.trim() || !message.trim()}
                                onClick={handleCreate}
                            >
                                <Send className="h-4 w-4" />
                                {isSending ? "Gönderiliyor..." : "Talebi Gönder"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {tickets.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="font-serif text-xl text-foreground">Henüz destek talebiniz yok</p>
                        <p className="mt-2 text-muted-foreground">Herhangi bir sorunla karşılaşırsanız bize yazabilirsiniz.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Ticket List */}
                    <div className="space-y-3">
                        {tickets.map((ticket) => {
                            const isPending = ticket.status === "OPEN" || ticket.status === "PENDING"
                            const isSelected = selectedTicket?.id === ticket.id
                            return (
                                <Card
                                    key={ticket.id}
                                    className={`cursor-pointer transition-colors hover:border-primary ${isSelected ? "border-primary" : ""}`}
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                                                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {formatDateTR(ticket.createdAt, "compact")}
                                                </p>
                                            </div>
                                            <Badge variant={isPending ? "secondary" : "default"} className={!isPending ? "bg-primary/10 text-primary" : ""}>
                                                {isPending ? "Bekliyor" : "Yanıtlandı"}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Ticket Detail */}
                    <div className="lg:sticky lg:top-24">
                        {selectedTicket ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-serif">{selectedTicket.subject}</CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        #{selectedTicket.id} · {formatDateTR(selectedTicket.createdAt, "minimal")}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Mesajınız</p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
                                    </div>

                                    {selectedTicket.adminReplies && selectedTicket.adminReplies.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-foreground">Yanıtlar</p>
                                            {selectedTicket.adminReplies.map((reply, i) => (
                                                <div key={i} className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                                                    <p className="text-xs text-primary font-medium mb-1">Can Antika Destek</p>
                                                    <p className="text-sm text-foreground">{reply}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(!selectedTicket.adminReplies || selectedTicket.adminReplies.length === 0) && (
                                        <p className="text-center text-sm text-muted-foreground py-4">
                                            Henüz yanıt gelmedi. En kısa sürede size dönüş yapacağız.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="flex h-64 items-center justify-center">
                                    <p className="text-muted-foreground">Detay görmek için bir talep seçin</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function SupportPage() {
    return <SupportContent />
}