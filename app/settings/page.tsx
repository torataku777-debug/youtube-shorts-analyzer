
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
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
                        <Button>変更を保存</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>通知設定</CardTitle>
                        <CardDescription>動画が急上昇した際に通知を受け取ります。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>メール通知</Label>
                                <p className="text-sm text-muted-foreground">毎日の分析レポートを受け取る。</p>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Slack連携</Label>
                                <p className="text-sm text-muted-foreground">成長率が50%を超えた場合に#generalに通知する。</p>
                            </div>
                            <Switch disabled />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
