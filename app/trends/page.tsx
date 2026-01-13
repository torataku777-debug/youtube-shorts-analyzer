import RisingStarsSection from './rising-stars-section';

// Disable caching
export const revalidate = 0;

export default function TrendsPage() {
    return (
        <div className="container mx-auto py-8">
            <header className="space-y-2 mb-10">
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent w-fit">
                    Rising Stars (注目のチャンネル)
                </h2>
                <p className="text-muted-foreground max-w-2xl">
                    投稿数が少なく、開設から間もないにも関わらず、高い平均再生数を記録している急成長チャンネルを抽出しています。
                </p>
            </header>

            <RisingStarsSection />
        </div>
    )
}
