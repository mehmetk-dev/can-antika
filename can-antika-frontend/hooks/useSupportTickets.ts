"use client"

import { useState, useEffect, useCallback } from "react"
import { supportTicketApi } from "@/lib/api"
import { toast } from "sonner"
import type { SupportTicketResponse } from "@/lib/types"

export function useSupportTickets() {
    const [tickets, setTickets] = useState<SupportTicketResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        supportTicketApi
            .getMyTickets()
            .then(setTickets)
            .catch(() => setTickets([]))
            .finally(() => setIsLoading(false))
    }, [])

    const createTicket = useCallback(async (subject: string, message: string) => {
        if (!subject.trim() || !message.trim()) return false
        setIsSending(true)
        try {
            const ticket = await supportTicketApi.create({ subject, message })
            setTickets((prev) => [ticket, ...prev])
            toast.success("Destek talebiniz oluşturuldu")
            return true
        } catch {
            toast.error("Talep oluşturulamadı")
            return false
        } finally {
            setIsSending(false)
        }
    }, [])

    return { tickets, isLoading, isSending, createTicket }
}
