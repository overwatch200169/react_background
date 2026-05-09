import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { Card, Statistic } from 'antd'
import { TeamOutlined, FileTextOutlined, RiseOutlined } from '@ant-design/icons'
import type { UserPublic, ArticleList } from '@/types'

export default function Dashboard() {
  const { user } = useAuth()
  const [userCount, setUserCount] = useState(0)
  const [articleCount, setArticleCount] = useState(0)
  interface ArticlePageResponse {
  total: number
  items: ArticleList[]
}

  useEffect(() => {
    api.get<UserPublic[]>('/api/v1/users').then((r) => setUserCount(r.data.length)).catch(() => {})
    api.get<ArticlePageResponse>('/api/v1/article/all').then((r) => setArticleCount(r.data.total)).catch(() => {})
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>仪表盘</h1>
        <p style={{ color: 'var(--text-secondary)' }}>欢迎回来，{user?.username}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        <Card>
          <Statistic
            title="用户总数"
            value={userCount}
            prefix={<TeamOutlined style={{ color: '#2563eb' }} />}
          />
        </Card>
        <Card>
          <Statistic
            title="文章总数"
            value={articleCount}
            prefix={<FileTextOutlined style={{ color: 'var(--color-primary)' }} />}
          />
        </Card>
        <Card>
          <Statistic
            title="当前用户"
            value={user?.username ?? '-'}
            prefix={<RiseOutlined style={{ color: '#7c3aed' }} />}
          />
        </Card>
      </div>
    </div>
  )
}
