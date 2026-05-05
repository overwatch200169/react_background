import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { ArticlePublic, ArticleCreate } from '@/types'
import MDEditor from '@uiw/react-md-editor'

export default function ArticleEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [form, setForm] = useState<ArticleCreate>({ title: '', body: '', tags: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
        .catch(() => setError('文章加载失败'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
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
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/articles')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isNew ? '新建文章' : '编辑文章'}</h1>
          <p className="text-muted-foreground">{isNew ? '创建一篇新的博客文章' : '修改文章内容'}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? '创建文章' : '编辑内容'}</CardTitle>
          <CardDescription>请填写文章的标题、内容和标签</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="请输入文章标题"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                placeholder="多个标签用逗号分隔，如: 技术,前端,React"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2" data-color-mode="light">
              <Label htmlFor="body">正文内容（Markdown）</Label>
              <MDEditor
                value={form.body}
                onChange={(val) => setForm({ ...form, body: val ?? '' })}
                height={400}
                preview="live"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/articles')}>取消</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNew ? '发布' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
