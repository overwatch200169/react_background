import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, TrendingUp } from 'lucide-react'
import type { UserPublic, ArticleList } from '@/types'

export default function Dashboard() {
  const { user } = useAuth()
  const [userCount, setUserCount] = useState(0)
  const [articleCount, setArticleCount] = useState(0)

  useEffect(() => {
    api.get<UserPublic[]>('/api/v1/users').then((r) => setUserCount(r.data.length)).catch(() => {})
    api.get<ArticleList[]>('/api/v1/article/all').then((r) => setArticleCount(r.data.length)).catch(() => {})
  }, [])

  const stats = [
    { title: '用户总数', value: userCount, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { title: '文章总数', value: articleCount, icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
    { title: '当前用户', value: user?.username ?? '-', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">欢迎回来，{user?.username}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
