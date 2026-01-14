
import { TrendFilters } from "@/components/dashboard/TrendFilters"
import { RegionSelector } from "@/components/dashboard/RegionSelector"
import { KidsFilter } from "@/components/dashboard/KidsFilter"
import { VideoGrid } from "@/components/dashboard/VideoGrid"
import { supabase } from "@/lib/supabase"
import { Suspense } from "react"
import { Settings } from "lucide-react"
import Link from "next/link"

// Disable caching to see updates
export const revalidate = 0;

interface PageProps {
  searchParams: { period?: string, region?: string, hide_kids?: string }
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(searchParams);
  const period = resolvedParams?.period || '24h';
  const region = resolvedParams?.region || 'JP';
  const hideKids = resolvedParams?.hide_kids === 'true';

  let hours = 24;
  if (period === '7d') hours = 24 * 7;
  if (period === '30d') hours = 24 * 30;

  console.log(`Fetching trending shorts for period: ${hours}h, region: ${region}, hide_kids: ${hideKids}`);

  // Call the RPC function
  const { data: videos, error } = await supabase
    .rpc('get_trending_shorts', {
      period_hours: hours,
      target_region: region,
      hide_kids: hideKids
    });

  if (error) {
    console.error("Error fetching trending shorts:", error);
  }

  let displayVideos = videos || [];

  if (!videos && error) {
    // Fallback
    let query = supabase
      .from('videos')
      .select(`
        *,
        daily_metrics(view_count, like_count),
        channels(title, youtube_id)
      `)
      .eq('region', region)
      .limit(20);

    if (hideKids) {
      query = query.eq('is_kids', false);
    }

    const { data: latestVideos } = await query;

    displayVideos = latestVideos?.map((v: any) => ({
      video_id: v.id,
      video_youtube_id: v.youtube_id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      channel_title: v.channels?.title,
      channel_youtube_id: v.channels?.youtube_id,
      current_views: v.daily_metrics?.[0]?.view_count || 0,
      growth_views: 0,
      growth_rate: 0,
      is_high_rpm: v.is_high_rpm,
      is_faceless: v.is_faceless,
      audio_info: v.audio_info,
      is_kids: v.is_kids
    })) || [];
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-8 px-8 border-b mb-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">ダッシュボード</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {region === 'JP' ? '日本' : 'アメリカ'}で急上昇中のYouTubeショート
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/settings" className="md:hidden p-2 text-muted-foreground hover:text-foreground">
              <Settings className="w-5 h-5" />
            </Link>
            <div className="hidden md:block">
              <Suspense>
                <KidsFilter />
              </Suspense>
            </div>
            <Suspense>
              <RegionSelector />
            </Suspense>
          </div>
        </header>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">急上昇ランキング</h3>
          <Suspense>
            <TrendFilters />
          </Suspense>
        </div>

        {error && (
          <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-md text-sm border border-yellow-500/20">
            Note: 成長率計算用の関数(get_trending_shorts)が更新されていません。migration_rpm_faceless.sqlを実行してください。
          </div>
        )}

        <div className="mt-6">
          <VideoGrid videos={displayVideos} />
        </div>
      </div>
    </div>
  )
}
