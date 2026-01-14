'use client';

import { useState, useEffect } from "react";
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
    const [settings, setSettings] = useState<{
        defaultMode: string;
        excludedChannels: string;
        strictSensitivity: boolean;
        keywords: string;
    } | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('shorts_expert_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings(parsed);
                if (parsed.defaultMode === 'compact') {
                    setIsCompact(true);
                }
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const filteredVideos = videos.filter(video => {
        if (!settings) return true;

        // Exclude channels
        if (settings.excludedChannels) {
            const excluded = settings.excludedChannels.split('\n').map(s => s.trim()).filter(Boolean);
            if (excluded.some(ex =>
                video.channel_title?.includes(ex) ||
                video.channel_youtube_id === ex
            )) {
                return false;
            }
        }
        return true;
    });

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
                {filteredVideos.length > 0 ? (
                    filteredVideos.map((video) => {
                        // Strict Sensitivity Logic
                        let showHighRpm = video.is_high_rpm;
                        if (settings?.strictSensitivity && video.is_high_rpm) {
                            // If strict mode is ON, re-verify with keywords
                            const keywords = settings.keywords.split(',').map(s => s.trim().replace(/^#/, '')).filter(Boolean);
                            const titleLower = video.title.toLowerCase();
                            // Check if any keyword matches
                            const hasMatch = keywords.some(k => titleLower.includes(k.toLowerCase()));
                            if (!hasMatch) showHighRpm = false;
                        }

                        return (
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
                                isHighRpm={showHighRpm}
                                isFaceless={video.is_faceless}
                                audioInfo={video.audio_info}
                                isCompact={isCompact}
                            />
                        );
                    })
                ) : (
                    <p className="col-span-4 text-center text-muted-foreground py-10">
                        この期間のデータはまだありません。データが蓄積されるまでお待ちください。
                    </p>
                )}
            </div>
        </div>
    );
}
