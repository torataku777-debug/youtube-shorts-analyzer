
import { TrendFilters } from "@/components/dashboard/TrendFilters"
import { RegionSelector } from "@/components/dashboard/RegionSelector"
import { KidsFilter } from "@/components/dashboard/KidsFilter"
import { VideoGrid } from "@/components/dashboard/VideoGrid"
import { supabase } from "@/lib/supabase"
import { Suspense } from "react"
import { Settings } from "lucide-react"
import Link from "next/link"
import { DataRefresher } from "@/components/dashboard/DataRefresher";
import { dataProvider } from "@/lib/data-provider";

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
  if (period === '3d') hours = 72;
  if (period === '7d') hours = 168;

  console.log(`Fetching trending shorts for period: ${hours}h, region: ${region}, hide_kids: ${hideKids}`);

  // Call the Data Provider (abstracts Supabase vs Local JSON)
  let displayVideos = [];
  let errorMessage: string | null = null;

  try {
    displayVideos = await dataProvider.getTrendingShorts({
      period_hours: hours,
      target_region: region,
      hide_kids: hideKids
    });
  } catch (e) {
    console.error("Error fetching trending shorts:", e);
    errorMessage = (e as any).message || 'Unknown error';
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

        <DataRefresher hasData={displayVideos.length > 0} />

        {errorMessage && (
          <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-md text-sm border border-yellow-500/20">
            Note: {errorMessage}
          </div>
        )}

        <div className="mt-6">
          <VideoGrid videos={displayVideos} />
        </div>
      </div>
    </div>
  )
}
