'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';

interface DataRefresherProps {
    hasData: boolean;
}

export function DataRefresher({ hasData }: DataRefresherProps) {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        // If no data is displayed AND we aren't already working, trigger refresh
        if (!hasData && !isRefreshing) {
            const doRefresh = async () => {
                setIsRefreshing(true);
                setStatus('データベースを更新中... (YouTubeから最新のトレンドを取得しています)');

                try {
                    const res = await fetch('/api/system/refresh-data', { method: 'POST' });
                    if (!res.ok) throw new Error('Refresh failed');

                    setStatus('更新完了！ページを再読み込みします...');
                    setTimeout(() => {
                        router.refresh();
                        // Optional: Reload window to force clear state if needed
                        // window.location.reload(); 
                    }, 1000);
                } catch (e) {
                    console.error(e);
                    setStatus('更新に失敗しました。時間をおいて試してください。');
                    setIsRefreshing(false);
                }
            };

            doRefresh();
        }
    }, [hasData]); // Run only when hasData changes (or on mount if false)

    if (!isRefreshing) return null;

    return (
        <div className="mb-6 bg-blue-500/10 border border-blue-500/50 text-blue-500 p-4 rounded-lg flex items-start gap-3">
            <Loader2 className="h-4 w-4 mt-1 animate-spin shrink-0" />
            <div>
                <h5 className="font-medium leading-none tracking-tight mb-1">システム更新</h5>
                <div className="text-sm opacity-90">
                    {status}
                </div>
            </div>
        </div>
    );
}
