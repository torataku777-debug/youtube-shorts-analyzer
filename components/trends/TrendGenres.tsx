'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getTrendGenres, TrendGenre } from "@/lib/genre-analysis";
import { Sparkles, TrendingUp } from "lucide-react";

export function TrendGenres() {
    const [jpGenres, setJpGenres] = useState<TrendGenre[]>([]);
    const [usGenres, setUsGenres] = useState<TrendGenre[]>([]);

    useEffect(() => {
        const fetchGenres = async () => {
            const jp = await getTrendGenres('JP');
            const us = await getTrendGenres('US');
            setJpGenres(jp);
            setUsGenres(us);
        };
        fetchGenres();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* JP Column */}
            <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🇯🇵</span>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                日本のトレンドジャンル
                                <Badge variant="secondary" className="text-xs font-normal">
                                    <Sparkles className="w-3 h-3 mr-1 text-pink-500" />
                                    AI分析
                                </Badge>
                            </CardTitle>
                            <CardDescription>急上昇中のキーワードをAIがジャンル分けしました</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {jpGenres.map((genre, index) => (
                            <div key={genre.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border hover:bg-background/80 transition-colors">
                                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-pink-100 text-pink-600 font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="space-y-1 w-full">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">{genre.name}</h4>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {genre.score}%
                                            <span className="text-[10px] text-muted-foreground ml-1">急上昇</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {genre.tags.map(tag => (
                                            <span key={tag} className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* US Column */}
            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🇺🇸</span>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                US Trending Genres
                                <Badge variant="secondary" className="text-xs font-normal">
                                    <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
                                    AI Analysis
                                </Badge>
                            </CardTitle>
                            <CardDescription>AI-grouped trending keywords for US region</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {usGenres.map((genre, index) => (
                            <div key={genre.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border hover:bg-background/80 transition-colors">
                                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="space-y-1 w-full">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">{genre.name}</h4>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {genre.score}%
                                            <span className="text-[10px] text-muted-foreground ml-1">Trending</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {genre.tags.map(tag => (
                                            <span key={tag} className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
