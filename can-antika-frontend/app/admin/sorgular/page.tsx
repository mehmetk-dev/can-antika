"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Clock, CheckCircle, User, Mail, Calendar, Send, Loader2, Inbox, MessageSquare, Trash2, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { supportTicketApi } from "@/lib/api"
import { toast } from "sonner"
import type { SupportTicketResponse } from "@/lib/types"

type FilterStatus = "ALL" | "OPEN" | "RESOLVED"

export default function AdminInquiriesPage() {
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL")

  useEffect(() => {
    fetchTickets()
  }, [currentPage, statusFilter])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await supportTicketApi.getAllPaged(
        currentPage,
        10,
        statusFilter === "ALL" ? undefined : statusFilter
      )
      setTickets(response.items)
      setTotalPages(Math.ceil(response.totalElement / 10))
    } catch {
      toast.error("Talepler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId)

  const handleReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return
    setIsSending(true)
    try {
      const updated = await supportTicketApi.addReply(selectedTicketId, {
        adminReply: replyText,
        status: "RESOLVED"
      })
      setTickets((prev) => prev.map((t) => (t.id === selectedTicketId ? updated : t)))
      setReplyText("")
      toast.success("Yanıt eklendi")
    } catch {
      toast.error("Hata oluştu")
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bu sorunu arşivden (sadece sizden) silmek istediğinize emin misiniz?")) return
    try {
      await supportTicketApi.deleteForAdmin(id)
      setTickets((prev) => prev.filter((t) => t.id !== id))
      if (selectedTicketId === id) setSelectedTicketId(null)
      toast.success("Soru arşivinizden kaldırıldı")
    } catch {
      toast.error("Silme işlemi başarısız")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-sans">Soru Yönetimi</h1>
          <p className="text-sm text-muted-foreground">Müşteri geri bildirimlerini yanıtlayın ve arşivleyin</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border bg-background p-1 shadow-sm">
            {(["ALL", "OPEN", "RESOLVED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setStatusFilter(f); setCurrentPage(0); }}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${statusFilter === f ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {f === "ALL" ? "Hepsi" : f === "OPEN" ? "Bekleyen" : "Yanıtlanan"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 overflow-hidden min-h-[500px]">
        {/* List Section */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="space-y-3 pr-1">
            {tickets.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                <Inbox className="mb-2 h-8 w-8 opacity-20" />
                <p className="text-sm italic">Sonuç bulunamadı.</p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const isPending = ticket.status === "OPEN" || ticket.status === "PENDING"
                return (
                  <Card
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`cursor-pointer transition-all border-l-4 ${selectedTicketId === ticket.id
                        ? "border-l-primary bg-muted/30 shadow-sm"
                        : isPending ? "border-l-destructive/40" : "border-l-emerald-500/40"
                      } hover:bg-muted/10`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground opacity-60">#{ticket.id}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={isPending ? "destructive" : "outline"} className="text-[10px] h-5">
                            {isPending ? "Yeni" : "Yanıtlandı"}
                          </Badge>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id); }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-bold text-sm line-clamp-1 text-foreground">{ticket.subject}</h3>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="font-medium">{ticket.userName}</span>
                        <span className="px-1 opacity-30">•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold text-muted-foreground">
                Sayfa {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Detail Section */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <Card className="h-full border-2 overflow-hidden">
              <CardHeader className="border-b bg-muted/10 py-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">{selectedTicket.subject}</CardTitle>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground font-medium mt-1">
                      <span className="flex items-center gap-2 text-foreground"><User className="h-3.5 w-3.5 text-primary" /> {selectedTicket.userName}</span>
                      <span className="flex items-center gap-2 underline decoration-primary/20"><Mail className="h-3.5 w-3.5 text-primary" /> {selectedTicket.userEmail}</span>
                      <span className="flex items-center gap-2 mt-1 opacity-70"><Clock className="h-3.5 w-3.5" /> {formatDate(selectedTicket.createdAt)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] bg-background">REF-{selectedTicket.id}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Customer Question */}
                <div className="relative rounded-lg bg-muted/40 p-5 border border-primary/10 text-sm leading-relaxed shadow-inner">
                  <div className="absolute -top-2.5 left-3 bg-background px-2 border rounded-md text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Müşteri Sorusu</div>
                  {selectedTicket.message}
                </div>

                {/* Replies History */}
                <div className="space-y-4">
                  {selectedTicket.adminReplies && selectedTicket.adminReplies.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 block px-1">Yanıt Geçmişi</label>
                      {selectedTicket.adminReplies.map((reply, idx) => (
                        <div key={idx} className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-4 text-sm shadow-sm">
                          {reply}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Reply Form */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary block px-1">
                      {selectedTicket.adminReplies?.length ? "Yeni Yanıt Ekle" : "Yanıt Gönder"}
                    </label>
                    <Textarea
                      placeholder="Müşteriye iletilecek cevabı yazın..."
                      className="min-h-[120px] text-sm resize-none shadow-sm focus-visible:ring-primary border-primary/20"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <Button
                      className="w-full h-11 text-sm font-bold shadow-md transition-all active:scale-[0.98]"
                      onClick={handleReply}
                      disabled={isSending || !replyText.trim()}
                    >
                      {isSending ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gönderiliyor...</>
                      ) : (
                        <><Send className="h-4 w-4 mr-2" /> {selectedTicket.adminReplies?.length ? "Ek Yanıt Gönder" : "Gönder"}</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground bg-muted/5">
              <MessageSquare className="h-12 w-12 opacity-10 mb-4" />
              <p className="text-sm font-medium">Lütfen bir talep seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
