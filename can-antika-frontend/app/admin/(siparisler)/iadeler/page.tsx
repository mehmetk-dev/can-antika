"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { orderReturnApi } from "@/lib/api"
import { toast } from "sonner"
import type { OrderReturnResponse } from "@/lib/types"
import { getReturnStatus, returnStatusConfig } from "@/lib/commerce/order-utils"
import { formatDateTR } from "@/lib/utils"

export default function AdminReturnsPage() {
    const [returns, setReturns] = useState<OrderReturnResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        orderReturnApi
            .getAllReturns()
            .then(setReturns)
            .catch(() => setReturns([]))
            .finally(() => setIsLoading(false))
    }, [])

    const handleApprove = async (returnId: number) => {
        try {
            const updated = await orderReturnApi.approve(returnId)
            setReturns((prev) => prev.map((r) => (r.id === returnId ? updated : r)))
            toast.success("İade talebi onaylandı")
        } catch {
            toast.error("Onaylama başarısız")
        }
    }

    const handleReject = async (returnId: number) => {
        try {
            const updated = await orderReturnApi.reject(returnId)
            setReturns((prev) => prev.map((r) => (r.id === returnId ? updated : r)))
            toast.success("İade talebi reddedildi")
        } catch {
            toast.error("Reddetme başarısız")
        }
    }

    const formatDate = (dateStr: string) => {
        try {
            return formatDateTR(dateStr, "compact")
        } catch {
            return dateStr
        }
    }

    const filteredReturns = statusFilter === "all" ? returns : returns.filter((r) => r.status === statusFilter)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">İade Talepleri</h1>
                <p className="text-muted-foreground">İade taleplerini görüntüleyin ve yönetin</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Durum filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Durumlar</SelectItem>
                        {Object.entries(returnStatusConfig).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border bg-card">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>İade No</TableHead>
                                <TableHead>Sipariş No</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Sebep</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="w-[160px]">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReturns.map((ret) => {
                                const status = getReturnStatus(ret.status)
                                return (
                                    <TableRow key={ret.id}>
                                        <TableCell className="font-medium">#{ret.id}</TableCell>
                                        <TableCell>#{ret.orderId}</TableCell>
                                        <TableCell>{formatDate(ret.createdAt)}</TableCell>
                                        <TableCell className="max-w-[300px] truncate">{ret.reason}</TableCell>
                                        <TableCell>
                                            <Badge variant={status.variant} className={status.className}>
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {ret.status === "PENDING" ? (
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(ret.id)}>
                                                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                                        Onayla
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-red-50" onClick={() => handleReject(ret.id)}>
                                                        <XCircle className="mr-1 h-3.5 w-3.5" />
                                                        Reddet
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {filteredReturns.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        İade talebi bulunamadı
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}
