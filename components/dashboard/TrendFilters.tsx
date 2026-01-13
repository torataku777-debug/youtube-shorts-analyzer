
'use client'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"

export function TrendFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentPeriod = searchParams.get('period') || '24h'

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('period', value)
        router.push(`/?${params.toString()}`)
    }

    return (
        <Tabs defaultValue={currentPeriod} onValueChange={handleValueChange} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="24h">24時間</TabsTrigger>
                <TabsTrigger value="7d">7日間</TabsTrigger>
                <TabsTrigger value="30d">30日間</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
