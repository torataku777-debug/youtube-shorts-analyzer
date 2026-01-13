
import Link from "next/link"
import { LayoutDashboard, TrendingUp, Settings } from "lucide-react"

export function Sidebar() {
    return (
        <div className="h-screen w-64 border-r bg-background p-4 flex flex-col">
            <div className="mb-8">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    ShortsTrend JP
                </h1>
            </div>

            <nav className="space-y-2">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>ダッシュボード</span>
                </Link>
                <Link
                    href="/trends"
                    className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                >
                    <TrendingUp className="w-5 h-5" />
                    <span>トレンド</span>
                </Link>
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                >
                    <Settings className="w-5 h-5" />
                    <span>設定</span>
                </Link>
            </nav>
        </div>
    )
}
