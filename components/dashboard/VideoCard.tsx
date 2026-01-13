
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, TrendingUp } from "lucide-react"

interface VideoCardProps {
    title: string
    thumbnailUrl: string
    views: number
    likes: number
    growthViews?: number
    growthRate?: number
}

export function VideoCard({ title, thumbnailUrl, views, likes, growthViews, growthRate }: VideoCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
            <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={thumbnailUrl}
                    alt={title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                {growthRate !== undefined && growthRate > 0 ? (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1">
                        <span>+{growthRate}%</span>
                        <span>🚀</span>
                    </div>
                ) : (
                    <div className="absolute top-2 right-2 bg-blue-500/80 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1">
                        <span>新着</span>
                        <span>✨</span>
                    </div>
                )}
            </div>
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm line-clamp-2 leading-tight">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span>+{growthViews?.toLocaleString() ?? 0}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
