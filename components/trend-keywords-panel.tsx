'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingKeyword {
    id: string;
    keyword: string;
    frequency: number;
    region: string;
}

export default function TrendKeywordsPanel({ onKeywordSelect }: { onKeywordSelect?: (keyword: string) => void }) {
    const [keywordsJP, setKeywordsJP] = useState<TrendingKeyword[]>([]);
    const [keywordsUS, setKeywordsUS] = useState<TrendingKeyword[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKeywords = async () => {
            setLoading(true);
            try {
                // Fetch Japanese Keywords
                const { data: jpData, error: jpError } = await supabase
                    .from('trending_keywords')
                    .select('*')
                    .eq('region', 'JP')
                    .order('frequency', { ascending: false })
                    .limit(15);

                if (jpError) console.error("Error fetching JP keywords:", jpError);
                else setKeywordsJP(jpData || []);

                // Fetch US Keywords
                const { data: usData, error: usError } = await supabase
                    .from('trending_keywords')
                    .select('*')
                    .eq('region', 'US')
                    .order('frequency', { ascending: false })
                    .limit(15);

                if (usError) console.error("Error fetching US keywords:", usError);
                else setKeywordsUS(usData || []);

            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchKeywords();
    }, []);

    const KeywordList = ({ title, keywords, colorClass }: { title: string, keywords: TrendingKeyword[], colorClass: string }) => (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
            <div className="flex flex-wrap gap-2">
                {keywords.map(k => (
                    <Badge
                        key={k.id}
                        variant="secondary"
                        className={`cursor-pointer hover:scale-105 transition-transform px-3 py-1 text-sm ${colorClass}`}
                        onClick={() => onKeywordSelect && onKeywordSelect(k.keyword)}
                    >
                        #{k.keyword}
                    </Badge>
                ))}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                </div>
            </div>
        );
    }

    if (keywordsJP.length === 0 && keywordsUS.length === 0) {
        return null;
    }

    return (
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="text-xl">📈</span> トレンドキーワード (Real-time)
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
                <KeywordList title="🇯🇵 Japan" keywords={keywordsJP} colorClass="hover:bg-pink-100 hover:text-pink-700 dark:hover:bg-pink-900 dark:hover:text-pink-100" />
                <KeywordList title="🇺🇸 United States" keywords={keywordsUS} colorClass="hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-100" />
            </div>
        </div>
    );
}
