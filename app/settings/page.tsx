'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ExpertSettings {
    defaultRegion: string;
    defaultMode: string;
    strictSensitivity: boolean;
    excludedChannels: string;
    keywords: string;
}

export default function SettingsPage() {
    const [isSaved, setIsSaved] = useState(false);
    const [settings, setSettings] = useState<ExpertSettings>({
        defaultRegion: 'JP',
        defaultMode: 'standard',
        strictSensitivity: false,
        excludedChannels: '',
        keywords: '#shorts, #vtuber, #gaming'
    });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('shorts_expert_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
        setLoaded(true);
    }, []);

    const handleSave = () => {
        localStorage.setItem('shorts_expert_settings', JSON.stringify(settings));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    if (!loaded) return null;

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">設定</h2>
                <p className="text-muted-foreground mt-1">
                    リサーチ効率を最大化するための詳細設定を管理します。
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
                            <Label htmlFor="keywords">キーワード (カンマ区切り)</Label>
                            <Input
                                id="keywords"
                                value={settings.keywords}
                                onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>玄人向け設定 (Expert Settings)</CardTitle>
                        <CardDescription>初期表示やフィルタリングの挙動をカスタマイズします。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>デフォルト地域</Label>
                                <Select
                                    value={settings.defaultRegion}
                                    onValueChange={(val) => setSettings({ ...settings, defaultRegion: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select region" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="JP">🇯🇵 日本 (JP)</SelectItem>
                                        <SelectItem value="US">🇺🇸 アメリカ (US)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">起動時に表示する地域を固定します。</p>
                            </div>

                            <div className="space-y-2">
                                <Label>デフォルト表示モード</Label>
                                <Select
                                    value={settings.defaultMode}
                                    onValueChange={(val) => setSettings({ ...settings, defaultMode: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">標準 (4列)</SelectItem>
                                        <SelectItem value="compact">極小 (8列)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">一覧のグリッド表示サイズを固定します。</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="space-y-0.5">
                                <Label>高単価判定の感度 (Strict Mode)</Label>
                                <p className="text-xs text-muted-foreground">
                                    ONにすると「完全一致」に近い厳密な判定のみバッジを表示します。<br />
                                    OFFの場合は部分一致など緩やかな判定を含みます。
                                </p>
                            </div>
                            <Switch
                                checked={settings.strictSensitivity}
                                onCheckedChange={(checked) => setSettings({ ...settings, strictSensitivity: checked })}
                            />
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <Label htmlFor="excludes">除外チャンネルリスト</Label>
                            <textarea
                                id="excludes"
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="チャンネル名またはIDを改行区切りで入力..."
                                value={settings.excludedChannels}
                                onChange={(e) => setSettings({ ...settings, excludedChannels: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">ここに一致するチャンネルは一覧に表示されなくなります。</p>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
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
