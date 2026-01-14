'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react";

export default function SettingsPage() {
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">設定</h2>
                <p className="text-muted-foreground mt-1">
                    分析や通知の設定を管理します。
                </p>
            </header>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>トラッキング設定</CardTitle>
                        <CardDescription>分析対象のキーワードを設定します。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="keywords">キーワード</Label>
                            <Input id="keywords" defaultValue="#shorts, #vtuber, #gaming" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={handleSave}
                                className="w-32"
                            >
                                変更を保存
                            </Button>
                            {isSaved && (
                                <span className="text-green-600 flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                                    <Check className="h-4 w-4" />
                                    保存しました
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
