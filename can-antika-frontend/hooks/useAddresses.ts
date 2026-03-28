"use client"

import { useState, useEffect, useCallback } from "react"
import { addressApi } from "@/lib/api"
import { toast } from "sonner"
import type { AddressResponse, AddressRequest } from "@/lib/types"

export function useAddresses() {
    const [addresses, setAddresses] = useState<AddressResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        addressApi
            .getMyAddresses()
            .then(setAddresses)
            .catch(() => setAddresses([]))
            .finally(() => setIsLoading(false))
    }, [])

    const saveAddress = useCallback(async (data: AddressRequest, editingId?: number) => {
        setIsSaving(true)
        try {
            if (editingId) {
                const updated = await addressApi.update(editingId, data)
                setAddresses((prev) => prev.map((a) => (a.id === editingId ? updated : a)))
                toast.success("Adres güncellendi")
            } else {
                const created = await addressApi.save(data)
                setAddresses((prev) => [...prev, created])
                toast.success("Adres eklendi")
            }
            return true
        } catch {
            toast.error("Adres kaydedilirken hata oluştu")
            return false
        } finally {
            setIsSaving(false)
        }
    }, [])

    const deleteAddress = useCallback(async (id: number) => {
        try {
            await addressApi.delete(id)
            setAddresses((prev) => prev.filter((a) => a.id !== id))
            toast.success("Adres silindi")
        } catch {
            toast.error("Adres silinirken hata oluştu")
        }
    }, [])

    return { addresses, isLoading, isSaving, saveAddress, deleteAddress }
}
