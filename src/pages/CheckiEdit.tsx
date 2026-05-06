import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { CheckiCount } from '@/types'

export default function CheckiEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [name, setName] = useState('')
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isNew) {
      setLoading(true)
      api.get<CheckiCount[]>('/api/v1/egg/checki')
        .then((r) => {
          const item = r.data.find((i) => i.id === Number(id))
          if (item) {
            setName(item.name ?? '')
            setCount(item.cheki_count ?? 0)
          } else {
            setError('未找到该项目')
          }
        })
        .catch(() => setError('加载失败'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isNew) {
        await api.post('/api/v1/egg/checki', { name, cheki_count: count })
      } else {
        await api.patch('/api/v1/egg/checki', { cheki_count: count }, { params: { id } })
      }
      navigate('/checki')
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/checki')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isNew ? '新建项目' : '编辑项目'}</h1>
          <p className="text-muted-foreground">{isNew ? '创建一个新的 Checki 打卡项目' : '修改打卡项目信息'}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? '创建项目' : '编辑内容'}</CardTitle>
          <CardDescription>请填写项目名称和打卡次数</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                placeholder="请输入项目名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!isNew}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="count">打卡次数</Label>
              <Input
                id="count"
                type="number"
                min={0}
                placeholder="请输入打卡次数"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/checki')}>取消</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNew ? '创建' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
