"use client"

import { useState, useRef } from "react"
import { fileApi } from "@/lib/api"
import { toast } from "sonner"

const MAX_IMAGES = 6
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"])

function getFileExtension(name: string): string {
    return name.includes(".") ? name.split(".").pop()?.toLowerCase() ?? "" : ""
}

function isAllowedFile(file: File): boolean {
    const hasAllowedType = ALLOWED_MIME_TYPES.has((file.type || "").toLowerCase())
    const hasAllowedExt = ALLOWED_EXTENSIONS.has(getFileExtension(file.name))
    return file.size <= MAX_FILE_SIZE && (hasAllowedType || hasAllowedExt)
}

export function useProductImages(initialImages: string[] = []) {
    const [images, setImages] = useState<string[]>(initialImages)
    const [uploadingCount, setUploadingCount] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const maxSlots = MAX_IMAGES - images.length
        const selectedFiles = Array.from(files).slice(0, maxSlots)

        const oversized = selectedFiles.filter((f) => f.size > MAX_FILE_SIZE)
        if (oversized.length > 0) {
            toast.error(`${oversized.length} dosya 100MB s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor, atland\u0131.`)
        }

        const unsupported = selectedFiles.filter((f) => {
            const hasAllowedType = ALLOWED_MIME_TYPES.has((f.type || "").toLowerCase())
            const hasAllowedExt = ALLOWED_EXTENSIONS.has(getFileExtension(f.name))
            return !(hasAllowedType || hasAllowedExt)
        })
        if (unsupported.length > 0) {
            toast.error(
                `${unsupported.length} dosya format\u0131 desteklenmiyor. Desteklenen: JPEG, PNG, GIF, WebP (HEIC/HEIF desteklenmez).`,
            )
        }

        const validFiles = selectedFiles.filter(isAllowedFile)
        if (validFiles.length === 0) {
            if (fileInputRef.current) fileInputRef.current.value = ""
            return
        }

        setUploadingCount(validFiles.length)

        const uploadPromises = validFiles.map(async (file) => {
            try {
                const url = await fileApi.upload(file)
                setImages((prev) => {
                    if (prev.length >= MAX_IMAGES) return prev
                    return [...prev, url]
                })
            } catch (error) {
                const reason = error instanceof Error ? error.message : "Y\u00FCkleme hatas\u0131"
                toast.error(`"${file.name}" y\u00FCklenemedi: ${reason}`)
            } finally {
                setUploadingCount((prev) => prev - 1)
            }
        })

        await Promise.allSettled(uploadPromises)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index))
    }

    return { images, setImages, uploadingCount, fileInputRef, handleImageUpload, removeImage }
}
