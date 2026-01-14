
'use client'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function RegionSelector() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentRegion = searchParams.get('region') || 'JP'
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem('shorts_expert_settings')
        if (saved) {
            try {
                const settings = JSON.parse(saved)
                if (settings.defaultRegion && !searchParams.get("region")) {
                    if (settings.defaultRegion !== "JP") {
                        const params = new URLSearchParams(searchParams.toString())
                        params.set("region", settings.defaultRegion)
                        router.replace(`/?${params.toString()}`)
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }
    }, [searchParams, router])

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('region', value)
        router.push(`/?${params.toString()}`)
    }

    if (!mounted) return null

    return (
        <Tabs defaultValue={currentRegion} onValueChange={handleValueChange} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="JP">🇯🇵 日本</TabsTrigger>
                <TabsTrigger value="US">🇺🇸 US</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
