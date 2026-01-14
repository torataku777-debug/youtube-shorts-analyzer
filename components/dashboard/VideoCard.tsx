
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, TrendingUp, Music } from "lucide-react"

interface VideoCardProps {
    videoId: string
    title: string
    thumbnailUrl: string
    channelId: string
    channelTitle?: string
    views: number
    likes: number
    growthViews?: number
    growthRate?: number
    isHighRpm?: boolean
    isFaceless?: boolean
    audioInfo?: string | null // string or null
    isCompact?: boolean
}

export function VideoCard({
    videoId,
    title,
    thumbnailUrl,
    channelId,
    channelTitle,
    views,
    likes,
    growthViews,
    growthRate,
    isHighRpm,
    isFaceless,
    audioInfo,
    isCompact = false
}: VideoCardProps) {
    return (
        <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 group ${isHighRpm ? 'border-amber-400 border-2' : ''} ${isFaceless ? 'border-blue-400 border-2' : ''}`}>
            <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                </a>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    {isHighRpm && (
                        <div className={`bg-amber-500 text-white font-bold rounded-full shadow-sm border border-amber-300 ${isCompact ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}>
                            💰 {isCompact ? '' : '高単価'}
                        </div>
                    )}
                    {isFaceless && (
                        <div className={`bg-blue-500 text-white font-bold rounded-full shadow-sm border border-blue-300 ${isCompact ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}>
                            👤 {isCompact ? '' : '顔出しなし'}
                        </div>
                    )}
                </div>

                {growthRate !== undefined && growthRate > 0 ? (
                    <div className={`absolute top-2 right-2 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1 ${isCompact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}>
                        <span>+{growthRate}%</span>
                        {!isCompact && <span>🚀</span>}
                    </div>
                ) : (
                    <div className={`absolute top-2 right-2 bg-blue-500/80 text-white font-bold rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1 ${isCompact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}>
                        <span>新着</span>
                        {!isCompact && <span>✨</span>}
                    </div>
                )}
            </div>
            <CardHeader className={`${isCompact ? 'p-2 space-y-0.5' : 'p-4 pb-2 space-y-1'}`}>
                <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    <CardTitle className={`line-clamp-2 leading-tight ${isCompact ? 'text-xs' : 'text-sm'}`}>
                        {title}
                    </CardTitle>
                </a>
                {channelTitle && (
                    <a href={`https://www.youtube.com/channel/${channelId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors block truncate">
                        {channelTitle}
                    </a>
                )}
            </CardHeader>
            <CardContent className={`${isCompact ? 'p-2 pt-0' : 'p-4 pt-0'}`}>
                <div className={`grid grid-cols-2 gap-2 text-muted-foreground mt-2 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                    <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span>+{growthViews?.toLocaleString() ?? 0}</span>
                    </div>
                </div>
                {audioInfo && !isCompact && (
                    <div className="mt-3 flex items-start gap-1.5 text-[10px] text-muted-foreground bg-secondary/50 p-1.5 rounded-md">
                        <Music className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{audioInfo}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
