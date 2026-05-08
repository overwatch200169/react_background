import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/lib/api'
import { Button, Input, Card, Typography, Space, message, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import type { ArticlePublic, ArticleCreate } from '@/types'
import Cherry from 'cherry-markdown'
import 'cherry-markdown/dist/cherry-markdown.css'

const { Title, Text } = Typography

export default function ArticleEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [form, setForm] = useState<ArticleCreate>({ title: '', body: '', tags: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const cherryInstance = useRef<Cherry | null>(null)

  useEffect(() => {
    if (editorRef.current && !cherryInstance.current) {
      cherryInstance.current = new Cherry({
        el: editorRef.current,
        value: form.body,
        editor: {
          defaultModel: 'edit&preview',
          height: '400px',
        },
        locale: 'zh_CN',
        callback: {
          afterChange: (markdownText: string) => {
            setForm((prev) => ({ ...prev, body: markdownText }))
          },
        },
      })
    }
    return () => {
      if (cherryInstance.current) {
        cherryInstance.current.destroy()
        cherryInstance.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isNew) {
      setLoading(true)
      api.get<ArticlePublic>(`/api/v1/article/${id}`)
        .then((r) => {
          setForm({
            title: r.data.title ?? '',
            body: r.data.body ?? '',
            tags: r.data.tags ?? '',
          })
        })
        .catch(() => message.error('文章加载失败'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew])

  const handleSubmit = async () => {
    if (!form.title || !form.body) {
      message.warning('请填写标题和内容')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        await api.post('/api/v1/article/', form)
      } else {
        await api.patch(`/api/v1/article/${id}`, form)
      }
      navigate('/articles')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败'
      message.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/articles')} />
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>{isNew ? '新建文章' : '编辑文章'}</Title>
          <Text type="secondary">{isNew ? '创建一篇新的博客文章' : '修改文章内容'}</Text>
        </div>
      </div>

      <Card
        title={isNew ? '创建文章' : '编辑内容'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>标题</Text>
            <Input
              placeholder="请输入文章标题"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>标签</Text>
            <Input
              placeholder="多个标签用逗号分隔"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>正文内容（Markdown）</Text>
            <div ref={editorRef} />
          </div>

          <Space>
            <Button onClick={() => navigate('/articles')}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={saving} style={{ background: '#006B5E' }}>
              {isNew ? '发布' : '保存'}
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}
