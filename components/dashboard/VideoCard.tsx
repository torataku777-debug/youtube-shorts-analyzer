
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
    size = 'medium'
}: VideoCardProps & { size?: 'large' | 'medium' | 'small' }) {

    // Style configurations based on size
    const isSmall = size === 'small';
    const isMedium = size === 'medium';
    const isLarge = size === 'large';

    const paddingClass = isSmall ? 'p-1' : isMedium ? 'p-2' : 'p-4 pb-2';
    const contentPaddingClass = isSmall ? 'p-1 pt-0' : isMedium ? 'p-2 pt-0' : 'p-4 pt-0';
    const titleSizeClass = isSmall ? 'text-[10px]' : isMedium ? 'text-xs' : 'text-sm';
    const metaSizeClass = isSmall ? 'text-[9px]' : isMedium ? 'text-[10px]' : 'text-xs';

    // Badge styles
    const badgeBase = "font-bold rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm";
    const badgeSize = isSmall ? 'text-[8px] px-1 py-0.5' : isMedium ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';

    return (
        <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 group ${isHighRpm ? 'border-amber-400 border-2' : ''} ${isFaceless ? 'border-blue-400 border-2' : ''} group`}>
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
                        <div className={`bg-amber-500 text-white border border-amber-300 ${badgeBase} ${badgeSize}`}>
                            <span>💰</span> {!isSmall && <span>高単価</span>}
                        </div>
                    )}
                    {isFaceless && (
                        <div className={`bg-blue-500 text-white border border-blue-300 ${badgeBase} ${badgeSize}`}>
                            <span>👤</span> {!isSmall && <span>顔出しなし</span>}
                        </div>
                    )}
                </div>

                {growthRate !== undefined && growthRate > 0 ? (
                    <div className={`absolute top-2 right-2 bg-gradient-to-r from-red-600 to-orange-600 text-white ${badgeBase} ${badgeSize}`}>
                        <span>+{growthRate}%</span>
                        {!isSmall && <span>🚀</span>}
                    </div>
                ) : (
                    <div className={`absolute top-2 right-2 bg-blue-500/80 text-white ${badgeBase} ${badgeSize}`}>
                        <span>新着</span>
                        {!isSmall && <span>✨</span>}
                    </div>
                )}
            </div>

            <CardHeader className={`${paddingClass} space-y-0.5`}>
                <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    <CardTitle className={`line-clamp-2 leading-tight ${titleSizeClass}`}>
                        {title}
                    </CardTitle>
                </a>
                {channelTitle && (
                    <a href={`https://www.youtube.com/channel/${channelId}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors block truncate text-[10px]">
                        {channelTitle}
                    </a>
                )}
            </CardHeader>

            <CardContent className={`${contentPaddingClass}`}>
                <div className={`grid grid-cols-2 gap-1 text-muted-foreground mt-1 ${metaSizeClass}`}>
                    <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span>+{growthViews?.toLocaleString() ?? 0}</span>
                    </div>
                </div>
                {audioInfo && isLarge && (
                    <div className="mt-2 flex items-start gap-1.5 text-[10px] text-muted-foreground bg-secondary/50 p-1.5 rounded-md">
                        <Music className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{audioInfo}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
