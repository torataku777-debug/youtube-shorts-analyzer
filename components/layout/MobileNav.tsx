'use client';

import Link from "next/link";
import { LayoutDashboard, TrendingUp, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export function MobileNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t h-16 md:hidden flex items-center justify-around px-4 pb-safe">
            <Link
                href="/"
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-medium">ダッシュボード</span>
            </Link>
            <Link
                href="/trends"
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/trends') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <TrendingUp className="w-5 h-5" />
                <span className="text-[10px] font-medium">トレンド</span>
            </Link>
            <Link
                href="/settings"
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/settings') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] font-medium">設定</span>
            </Link>
        </div>
    );
}
