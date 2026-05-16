import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Button, Card, Table, Tag, Input, Space, Popconfirm, Tooltip, Spin, message, Pagination } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, SearchOutlined } from '@ant-design/icons'
import type { ArticleList } from '@/types'
import { formatUTCToLocal } from '@/lib/utils'

interface ArticlePageResponse {
  total: number
  items: ArticleList[]
}

export default function Articles() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<ArticleList[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15
  const navigate = useNavigate()

  const fetchArticles = async (p: number = page, s: string = search) => {
    setLoading(true)
    try {
      const offset = (p - 1) * pageSize
      const isAdmin = user?.level === 0
      const url = isAdmin
        ? '/api/v1/article/all'
        : `/api/v1/users/${user?.user_id}/article`
      const res = await api.get<ArticlePageResponse>(url, {
        params: { offset, limit: pageSize, search: s || undefined },
      })
      setArticles(res.data.items)
      setTotal(res.data.total)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user) fetchArticles() }, [page, user])

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
    fetchArticles(1, val)
  }

  const handleDelete = async (id: number | null) => {
    if (!id) return
    try {
      await api.delete(`/api/v1/article/${id}`)
      fetchArticles()
    } catch { /* ignore */ }
  }

  const handleRecover = async (id: number) => {
    try {
      await api.patch(`/api/v1/article/recovery/${id}`)
      fetchArticles()
      message.success('已恢复')
    } catch { /* ignore */ }
  }

  const columns = [
    { title: 'ID', dataIndex: 'article_id', width: 70, render: (v: number | null) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { title: '标题', dataIndex: 'title', ellipsis: true, render: (v: string | null) => v ?? '-' },
    {
      title: '标签', dataIndex: 'tags', responsive: ['md'] as any,
      render: (v: string | null) => v?.split(',').slice(0, 3).map((tag, i) => (
        <Tag key={i} style={{ background: 'var(--tag-bg)', borderColor: 'var(--tag-border)', color: 'var(--tag-color)', marginRight: 4 }}>{tag.trim()}</Tag>
      )),
    },
    {
      title: '作者ID', dataIndex: 'author_id', responsive: ['sm'] as any, width: 90,
      render: (v: number | null) => <span style={{ fontFamily: 'monospace' }}>{v ?? '-'}</span>,
    },
    {
      title: '状态', dataIndex: 'alive', responsive: ['lg'] as any, width: 80,
      render: (alive: boolean | null) => (
        <Tag color={alive ? 'green' : 'default'}>{alive ? '正常' : '已删除'}</Tag>
      ),
    },
    {
      title: '创建时间', dataIndex: 'create_time', responsive: ['lg'] as any, width: 170,
      render: (v: string) => <span style={{ color: '#71717a' }}>{formatUTCToLocal(v)}</span>,
    },
    {
      title: '操作', width: 120,
      render: (_: any, record: ArticleList) => {
        const isOwner = record.author_id === user?.user_id
        return (
          <Space size={4}>
            <Tooltip title={isOwner ? '编辑' : '仅作者可编辑'}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                disabled={!isOwner}
                onClick={() => navigate(`/articles/${record.article_id}`)}
              />
            </Tooltip>
            {record.alive ? (
              <Popconfirm title="确定要删除该文章吗？" onConfirm={() => handleDelete(record.article_id)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
                <Tooltip title="删除">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            ) : (
              <Tooltip title="恢复">
                <Button
                  type="text"
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={() => record.article_id && handleRecover(record.article_id)}
                />
              </Tooltip>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>文章管理</h1>
          <p style={{ color: '#71717a' }}>管理博客文章内容</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/articles/new')} style={{ background: '#006B5E' }}>
          新建文章
        </Button>
      </div>

      <Card
        title="文章列表"
        extra={
          <Input
            placeholder="搜索标题或标签..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={articles}
            columns={columns}
            rowKey="article_id"
            pagination={false}
            locale={{ emptyText: '暂无文章' }}
            scroll={{ x: 700 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger={false}
              showTotal={(t) => `共 ${t} 条`}
              onChange={(p) => setPage(p)}
            />
          </div>
        </Spin>
      </Card>

    </div>
  )
}
