import { useState, useEffect, useRef } from "react"
import { productApi } from "@/lib/api"
import type { ProductResponse } from "@/lib/types"

export function useProductSearch() {
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<ProductResponse[]>([])
    const cacheRef = useRef<Map<string, ProductResponse[]>>(new Map())
    const requestIdRef = useRef(0)

    useEffect(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase()

        if (normalizedQuery.length < 2) {
            const clearTimer = setTimeout(() => setSearchResults([]), 0)
            return () => clearTimeout(clearTimer)
        }

        const cached = cacheRef.current.get(normalizedQuery)
        if (cached) {
            setSearchResults(cached)
            return
        }

        const requestId = ++requestIdRef.current
        const timer = setTimeout(() => {
            productApi.searchByTitle(normalizedQuery, 3500)
                .then((items) => {
                    if (requestId !== requestIdRef.current) return
                    const topItems = (items || []).slice(0, 5)
                    cacheRef.current.set(normalizedQuery, topItems)
                    setSearchResults(topItems)
                })
                .catch(() => {
                    if (requestId === requestIdRef.current) {
                        setSearchResults([])
                    }
                })
        }, 180)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const clearSearch = () => {
        requestIdRef.current += 1
        setSearchQuery("")
        setSearchResults([])
    }

    return { searchQuery, setSearchQuery, searchResults, clearSearch }
}
