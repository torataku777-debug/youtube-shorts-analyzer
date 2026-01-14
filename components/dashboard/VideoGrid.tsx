'use client';

import { useState } from "react";
import { VideoCard } from "@/components/dashboard/VideoCard";
import { LayoutGrid, Grip } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Video {
    video_id: string;
    video_youtube_id: string;
    title: string;
    thumbnail_url: string;
    channel_title?: string;
    channel_youtube_id: string;
    current_views: number;
    growth_views: number;
    growth_rate: number;
    is_high_rpm?: boolean;
    is_faceless?: boolean;
    audio_info?: string | null;
}

interface VideoGridProps {
    videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
    const [isCompact, setIsCompact] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <div className="flex items-center bg-muted rounded-lg p-1 border">
                    <Button
                        variant={!isCompact ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIsCompact(false)}
                        className="h-8 w-24 gap-2"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        標準
                    </Button>
                    <Button
                        variant={isCompact ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIsCompact(true)}
                        className="h-8 w-24 gap-2"
                    >
                        <Grip className="w-4 h-4" />
                        極小
                    </Button>
                </div>
            </div>

            <div className={`grid gap-4 ${isCompact
                    ? 'grid-cols-2 md:grid-cols-4 xl:grid-cols-8'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}>
                {videos.length > 0 ? (
                    videos.map((video) => (
                        <VideoCard
                            key={video.video_id}
                            videoId={video.video_youtube_id}
                            title={video.title}
                            thumbnailUrl={video.thumbnail_url}
                            channelId={video.channel_youtube_id}
                            channelTitle={video.channel_title}
                            views={video.current_views}
                            likes={0}
                            growthViews={video.growth_views}
                            growthRate={video.growth_rate}
                            isHighRpm={video.is_high_rpm}
                            isFaceless={video.is_faceless}
                            audioInfo={video.audio_info}
                            isCompact={isCompact}
                        />
                    ))
                ) : (
                    <p className="col-span-4 text-center text-muted-foreground py-10">
                        この期間のデータはまだありません。データが蓄積されるまでお待ちください。
                    </p>
                )}
            </div>
        </div>
    );
}
