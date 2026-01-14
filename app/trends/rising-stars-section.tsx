'use client';
// Force update

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import TrendKeywordsPanel from '@/components/trend-keywords-panel';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

function daysSince(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function formatCompactNumber(number: number) {
    return new Intl.NumberFormat('ja-JP', { notation: "compact", maximumFractionDigits: 1 }).format(number);
}

interface Channel {
    id: string;
    youtube_id: string;
    title: string;
    thumbnail_url: string;
    custom_url: string;
    video_count: number;
    view_count: number;
    published_at: string;
}

export default function RisingStarsSection() {
    const [channelsJP, setChannelsJP] = useState<Channel[]>([]);
    const [channelsUS, setChannelsUS] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [maxVideoCount, setMaxVideoCount] = useState<string>("10");
    const [minAvgViews, setMinAvgViews] = useState<string>("100000");
    const [maxMonths, setMaxMonths] = useState<string>("3");
    const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

    useEffect(() => {
        const fetchRisingStars = async () => {
            setLoading(true);
            try {
                const { data: jpData, error: jpError } = await supabase
                    .rpc('get_rising_stars', {
                        region_code: 'JP',
                        max_video_count: parseInt(maxVideoCount),
                        min_avg_views: parseInt(minAvgViews),
                        max_months_since_creation: parseInt(maxMonths)
                    });

                if (jpError) console.error("Error fetching JP stars:", jpError);
                else {
                    let filtered = jpData || [];
                    if (selectedKeyword) {
                        const k = selectedKeyword.toLowerCase();
                        filtered = filtered.filter((c: Channel) => c.title.toLowerCase().includes(k) || (c.custom_url && c.custom_url.toLowerCase().includes(k)));
                    }
                    setChannelsJP(filtered);
                }

                const { data: usData, error: usError } = await supabase
                    .rpc('get_rising_stars', {
                        region_code: 'US',
                        max_video_count: parseInt(maxVideoCount),
                        min_avg_views: parseInt(minAvgViews),
                        max_months_since_creation: parseInt(maxMonths)
                    });

                if (usError) console.error("Error fetching US stars:", usError);
                else {
                    let filtered = usData || [];
                    if (selectedKeyword) {
                        const k = selectedKeyword.toLowerCase();
                        filtered = filtered.filter((c: Channel) => c.title.toLowerCase().includes(k) || (c.custom_url && c.custom_url.toLowerCase().includes(k)));
                    }
                    setChannelsUS(filtered);
                }

            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRisingStars();
    }, [maxVideoCount, minAvgViews, maxMonths, selectedKeyword]);

    const ChannelList = ({ title, channels }: { title: string, channels: Channel[] }) => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold border-l-4 border-primary pl-3">{title}</h3>
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
                    ))}
                </div>
            ) : (!channels || channels.length === 0) ? (
                <p className="text-muted-foreground text-sm">条件に一致するチャンネルが見つかりませんでした。</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {channels.map((channel) => (
                        <Card key={channel.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-pink-500">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                                    <AvatarImage src={channel.thumbnail_url} alt={channel.title} />
                                    <AvatarFallback>{channel.title[0]}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 overflow-hidden">
                                    <CardTitle className="text-base truncate" title={channel.title}>
                                        {channel.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs truncate">
                                        {channel.custom_url || "No handle"}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-xs">平均再生数</p>
                                        <p className="font-bold text-lg">
                                            {formatCompactNumber(Math.round(channel.view_count / channel.video_count))}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-xs">運用歴</p>
                                        <p className="font-bold text-lg">
                                            {daysSince(channel.published_at)}日
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-xs">動画数</p>
                                        <p className="font-medium">
                                            {channel.video_count}本
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground text-xs">総再生数</p>
                                        <p className="font-medium">
                                            {formatCompactNumber(channel.view_count)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Keyword Panel */}
            <TrendKeywordsPanel onKeywordSelect={setSelectedKeyword} />

            {/* Filters */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="text-xl">🔍</span> 検索フィルター
                    </h3>
                    {selectedKeyword && (
                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium animate-in fade-in zoom-in">
                            <span>Keyword: #{selectedKeyword}</span>
                            <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-transparent" onClick={() => setSelectedKeyword(null)}>
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>投稿本数 (以下)</Label>
                        <Select value={maxVideoCount} onValueChange={setMaxVideoCount}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select count" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10本以下</SelectItem>
                                <SelectItem value="50">50本以下</SelectItem>
                                <SelectItem value="100">100本以下</SelectItem>
                                <SelectItem value="200">200本以下</SelectItem>
                                <SelectItem value="300">300本以下</SelectItem>
                                <SelectItem value="600">600本以下</SelectItem>
                                <SelectItem value="800">800本以下</SelectItem>
                                <SelectItem value="1000">1000本以下</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>平均再生数 (以上)</Label>
                        <Select value={minAvgViews} onValueChange={setMinAvgViews}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select views" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10000">1万回以上</SelectItem>
                                <SelectItem value="50000">5万回以上</SelectItem>
                                <SelectItem value="100000">10万回以上</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>チャンネル開設 (以内)</Label>
                        <Select value={maxMonths} onValueChange={setMaxMonths}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select months" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1ヶ月以内</SelectItem>
                                <SelectItem value="3">3ヶ月以内</SelectItem>
                                <SelectItem value="6">6ヶ月以内</SelectItem>
                                <SelectItem value="12">12ヶ月以内</SelectItem>
                                <SelectItem value="24">2年以内</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <ChannelList title="🇯🇵 Japan's Rising Stars" channels={channelsJP} />
            <ChannelList title="🇺🇸 US Rising Stars" channels={channelsUS} />
        </div>
    );
}
// final-fix-20260115
