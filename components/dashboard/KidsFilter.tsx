
'use client'

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"

export function KidsFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const hideKids = searchParams.get('hide_kids') === 'true'

    const handleCheckedChange = (checked: boolean) => {
        const params = new URLSearchParams(searchParams.toString())
        if (checked) {
            params.set('hide_kids', 'true')
        } else {
            params.delete('hide_kids')
        }
        router.push(`/?${params.toString()}`)
    }

    return (
        <div className="flex items-center space-x-2 bg-muted/50 px-3 py-2 rounded-lg border">
            <Switch id="kids-mode" checked={hideKids} onCheckedChange={handleCheckedChange} />
            <Label htmlFor="kids-mode" className="text-sm cursor-pointer whitespace-nowrap">
                キッズ向け動画を除外
            </Label>
        </div>
    )
}
