import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import api from '@/lib/api'
import { compressImage } from '@/lib/image-compress'
import { Button, Input, Card, Typography, Space, message, Spin, Modal, Tag } from 'antd'
import { ArrowLeftOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { ArticlePublic, ArticleCreate } from '@/types'
import Cherry from 'cherry-markdown'
import 'cherry-markdown/dist/cherry-markdown.css'

const { Title, Text } = Typography

function getDraftKey(articleId?: string) {
  return articleId ? `article-draft-${articleId}` : 'article-draft-new'
}

function loadDraft(articleId?: string): Partial<ArticleCreate> | null {
  try {
    const raw = localStorage.getItem(getDraftKey(articleId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraft(data: ArticleCreate, articleId?: string) {
  localStorage.setItem(getDraftKey(articleId), JSON.stringify(data))
}

function clearDraft(articleId?: string) {
  localStorage.removeItem(getDraftKey(articleId))
}

export default function ArticleEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [form, setForm] = useState({ title: '', body: '', tags: [] as string[] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const editorRef = useRef<HTMLDivElement>(null)
  const cherryInstance = useRef<Cherry | null>(null)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftCheckedRef = useRef(false)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const [tagInput, setTagInput] = useState('')

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
            tags: r.data.tags ? r.data.tags.split(',').filter(Boolean) : [],
          })
        })
        .catch(() => message.error('文章加载失败'))
        .finally(() => {
          setLoading(false)
          if (draftCheckedRef.current) return
          draftCheckedRef.current = true
          // 文章加载完后检查本地草稿
          const draft = loadDraft(id)
          if (draft && (draft.title || draft.body || draft.tags)) {
            Modal.confirm({
              title: '恢复本地草稿',
              icon: <ExclamationCircleOutlined />,
              content: '检测到上次编辑时保存的草稿，是否用草稿覆盖当前内容？',
              okText: '应用草稿',
              cancelText: '保持原文',
              onOk: () => {
                const restored = {
                  title: draft.title ?? '',
                  body: draft.body ?? '',
                  tags: draft.tags ? draft.tags.split(',').filter(Boolean) : [],
                }
                setForm(restored)
                setDraftRestored(true)
                if (cherryInstance.current) {
                  cherryInstance.current.setValue(restored.body)
                }
              },
              onCancel: () => clearDraft(id),
            })
          }
        })
    } else if (!draftCheckedRef.current) {
      draftCheckedRef.current = true
      const draft = loadDraft(id)
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
              tags: draft.tags ? draft.tags.split(',').filter(Boolean) : [],
            }
            setForm(restored)
            setDraftRestored(true)
            if (cherryInstance.current) {
              cherryInstance.current.setValue(restored.body)
            }
          },
          onCancel: () => clearDraft(id),
        })
      }
    }
  }, [id, isNew])

  // 自动保存草稿（防抖 2 秒）
  const scheduleDraftSave = useCallback((data: ArticleCreate) => {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      setDraftStatus('saving')
      setTimeout(() => {
        saveDraft(data, id)
        setDraftStatus('saved')
        setTimeout(() => setDraftStatus('idle'), 1500)
      }, 300)
    }, 2000)
  }, [id])

  useEffect(() => {
    if (!loading && (form.title || form.body || form.tags.length)) {
      scheduleDraftSave({ ...form, tags: form.tags.join(',') })
    }
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current)
    }
  }, [form, loading, scheduleDraftSave])

  // 判断是否有未保存的内容
  const hasUnsavedContent = !!(form.title || form.body || form.tags.length)

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
      const payload = { ...form, tags: form.tags.join(',') }
      if (isNew) {
        await api.post('/api/v1/article/', payload)
      } else {
        await api.patch(`/api/v1/article/${id}`, payload)
      }
      clearDraft(id)
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 6, minHeight: 40, alignItems: 'center', transition: 'border-color 0.2s', cursor: 'text' }}
              onClick={() => tagInputRef.current?.focus()}
            >
              {form.tags.map((tag) => (
                <Tag
                  key={tag}
                  closable
                  onClose={(e) => {
                    e.preventDefault()
                    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })
                  }}
                  style={{ margin: 0, userSelect: 'none', background: '#e2fbf7', borderColor: '#e2fbf7', color: '#002020' }}
                >
                  {tag}
                </Tag>
              ))}
              <input
                ref={tagInputRef}
                placeholder={form.tags.length ? '' : '输入标签后按 Enter 添加'}
                style={{ flex: 1, minWidth: 120, border: 'none', outline: 'none', padding: '4px 0', fontSize: 14, lineHeight: '20px', background: 'transparent' }}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const val = tagInput.trim()
                    if (!val) return
                    if (form.tags.includes(val)) {
                      message.warning('标签已存在')
                      return
                    }
                    setForm({ ...form, tags: [...form.tags, val] })
                    setTagInput('')
                  }
                  if (e.key === 'Backspace' && !tagInput && form.tags.length) {
                    setForm({ ...form, tags: form.tags.slice(0, -1) })
                  }
                }}
              />
            </div>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              按 Enter 添加标签，Backspace 删除最后一个
            </Text>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Text strong>正文内容（Markdown）</Text>
              {draftStatus === 'saving' && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <Spin size="small" style={{ marginRight: 4 }} />
                  正在保存草稿...
                </Text>
              )}
              {draftStatus === 'saved' && (
                <Text type="success" style={{ fontSize: 12 }}>
                  <CheckCircleOutlined />
                  草稿保存成功</Text>
              )}
            </div>
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
