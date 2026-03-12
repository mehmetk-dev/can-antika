import { useState, useEffect } from "react"
import { productApi } from "@/lib/api"
import type { ProductResponse } from "@/lib/types"

export function useProductSearch() {
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<ProductResponse[]>([])

    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            const clearTimer = setTimeout(() => setSearchResults([]), 0)
            return () => clearTimeout(clearTimer)
        }
        const timer = setTimeout(() => {
            productApi.search({ title: searchQuery.trim(), page: 0, size: 5 })
                .then((res) => setSearchResults(res.items || []))
                .catch(() => setSearchResults([]))
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const clearSearch = () => {
        setSearchQuery("")
        setSearchResults([])
    }

    return { searchQuery, setSearchQuery, searchResults, clearSearch }
}
