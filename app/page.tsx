
import { TrendFilters } from "@/components/dashboard/TrendFilters"
import { RegionSelector } from "@/components/dashboard/RegionSelector"
import { KidsFilter } from "@/components/dashboard/KidsFilter"
import { VideoCard } from "@/components/dashboard/VideoCard"
import { supabase } from "@/lib/supabase"
import { Suspense } from "react"

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
      .select(`*, daily_metrics(view_count, like_count)`)
      .eq('region', region)
      .limit(20);

    if (hideKids) {
      query = query.eq('is_kids', false);
    }

    const { data: latestVideos } = await query;

    displayVideos = latestVideos?.map((v: any) => ({
      video_id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      current_views: v.daily_metrics?.[0]?.view_count || 0,
      growth_views: 0,
      growth_rate: 0
    })) || [];
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
          <p className="text-muted-foreground mt-1">
            {region === 'JP' ? '日本' : 'アメリカ'}で急上昇中のYouTubeショートを分析
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Suspense>
            <KidsFilter />
          </Suspense>
          <Suspense>
            <RegionSelector />
          </Suspense>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">急上昇ランキング</h3>
          <Suspense>
            <TrendFilters />
          </Suspense>
        </div>

        {error && (
          <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-md text-sm border border-yellow-500/20">
            Note: 成長率計算用の関数(get_trending_shorts)が更新されていません。migration_kids.sqlを実行してください。
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {displayVideos.length > 0 ? (
            displayVideos.map((video: any) => (
              <VideoCard
                key={video.video_id}
                title={video.title}
                thumbnailUrl={video.thumbnail_url}
                views={video.current_views}
                likes={0}
                growthViews={video.growth_views}
                growthRate={video.growth_rate}
              />
            ))
          ) : (
            <p className="col-span-4 text-center text-muted-foreground py-10">
              この期間のデータはまだありません。データが蓄積されるまでお待ちください。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
