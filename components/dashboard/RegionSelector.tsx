
'use client'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"

export function RegionSelector() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentRegion = searchParams.get('region') || 'JP'

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('region', value)
        router.push(`/?${params.toString()}`)
    }

    return (
        <Tabs defaultValue={currentRegion} onValueChange={handleValueChange} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="JP">🇯🇵 日本</TabsTrigger>
                <TabsTrigger value="US">🇺🇸 US</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
