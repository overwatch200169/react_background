import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import api from '@/lib/api'
import { compressImage } from '@/lib/image-compress'
import { Button, Input, Card, Typography, Space, message, Spin, Modal } from 'antd'
import { ArrowLeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { ArticlePublic, ArticleCreate } from '@/types'
import Cherry from 'cherry-markdown'
import 'cherry-markdown/dist/cherry-markdown.css'

const { Title, Text } = Typography

const DRAFT_KEY = 'article-draft'

function loadDraft(): Partial<ArticleCreate> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraft(data: ArticleCreate) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

export default function ArticleEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [form, setForm] = useState<ArticleCreate>({ title: '', body: '', tags: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const cherryInstance = useRef<Cherry | null>(null)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftCheckedRef = useRef(false)

  useEffect(() => {
    if (!editorRef.current) return
    if (cherryInstance.current) {
      cherryInstance.current.setValue(form.body)
      return
    }
    cherryInstance.current = new Cherry({
      el: editorRef.current,
      value: form.body,
      editor: {
        defaultModel: 'edit&preview',
        height: '400px',
      },
      locale: 'zh_CN',
      fileUpload: (file: File, callback: (url: string) => void) => {
        compressImage(file)
          .then((compressed) => {
            const formData = new FormData()
            formData.append('file', compressed)
            return api.post<{ url: string }>('/api/v1/file/upload?folder=articles', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          })
          .then((res) => callback(res.data.url))
          .catch(() => message.error('文件上传失败'))
      },
      callback: {
        afterChange: (markdownText: string) => {
          setForm((prev) => ({ ...prev, body: markdownText }))
        },
      },
    })
    return () => {
      if (cherryInstance.current) {
        cherryInstance.current.destroy()
        cherryInstance.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

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
    } else if (!draftCheckedRef.current) {
      draftCheckedRef.current = true
      const draft = loadDraft()
      if (draft && (draft.title || draft.body || draft.tags)) {
        Modal.confirm({
          title: '恢复本地草稿',
          icon: <ExclamationCircleOutlined />,
          content: '检测到上次未完成的文章草稿，是否恢复？',
          okText: '恢复草稿',
          cancelText: '丢弃',
          onOk: () => {
            const restored = {
              title: draft.title ?? '',
              body: draft.body ?? '',
              tags: draft.tags ?? '',
            }
            setForm(restored)
            setDraftRestored(true)
            if (cherryInstance.current) {
              cherryInstance.current.setValue(restored.body)
            }
          },
          onCancel: () => clearDraft(),
        })
      }
    }
  }, [id, isNew])

  // 自动保存草稿（防抖 2 秒）
  const scheduleDraftSave = useCallback((data: ArticleCreate) => {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => saveDraft(data), 2000)
  }, [])

  useEffect(() => {
    if (!loading && (form.title || form.body || form.tags)) {
      scheduleDraftSave(form)
    }
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current)
    }
  }, [form, loading, scheduleDraftSave])

  // 判断是否有未保存的内容
  const hasUnsavedContent = !!(form.title || form.body || form.tags)

  // 拦截路由跳转（离开组件时确认）
  const blocker = useBlocker(hasUnsavedContent)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      Modal.confirm({
        title: '确认离开',
        icon: <ExclamationCircleOutlined />,
        content: '当前有未保存的内容，确定要离开吗？',
        okText: '离开',
        cancelText: '继续编辑',
        onOk: () => blocker.proceed?.(),
        onCancel: () => blocker.reset?.(),
      })
    }
  }, [blocker])

  // 关闭/刷新页面确认
  useEffect(() => {
    if (!hasUnsavedContent) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedContent])

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
      clearDraft()
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
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>{isNew ? '新建文章' : '编辑文章'}</Title>
          <Text type="secondary">{isNew ? '创建一篇新的博客文章' : '修改文章内容'}</Text>
          {draftRestored && (
            <Text type="warning" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
              已从本地草稿恢复
            </Text>
          )}
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
            <Button onClick={() => navigate(-1)}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={saving} style={{ background: '#006B5E' }}>
              {isNew ? '发布' : '保存'}
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}
