import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Trash2, Edit, RotateCcw, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { ArticleList } from '@/types'
import { formatUTCToLocal } from '@/lib/utils'

export default function Articles() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<ArticleList[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50
  const navigate = useNavigate()

  const fetchArticles = async (p: number = page) => {
    setLoading(true)
    try {
      const offset = (p - 1) * limit
      const res = await api.get<ArticleList[]>('/api/v1/article/all', {
        params: { offset, limit },
      })
      setArticles(res.data)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArticles() }, [page])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/api/v1/article/${deleteId}`)
      setDeleteId(null)
      fetchArticles()
    } catch { /* ignore */ }
  }

  const handleRecover = async (id: number) => {
    try {
      await api.patch(`/api/v1/article/recovery/${id}`)
      fetchArticles()
    } catch { /* ignore */ }
  }

  const filtered = articles.filter(
    (a) =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.tags?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">文章管理</h1>
          <p className="text-muted-foreground">管理博客文章内容</p>
        </div>
        <Button onClick={() => navigate('/articles/new')}>
          <Plus className="mr-2 h-4 w-4" />
          新建文章
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>文章列表</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索标题或标签..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead className="hidden md:table-cell">标签</TableHead>
                  <TableHead className="hidden sm:table-cell">作者ID</TableHead>
                  <TableHead className="hidden lg:table-cell">状态</TableHead>
                  <TableHead className="hidden lg:table-cell">创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">暂无文章</TableCell></TableRow>
                )}
                {filtered.map((a) => {
                  const isOwner = a.author_id === user?.user_id
                  return (
                    <TableRow key={a.article_id}>
                      <TableCell className="font-mono">{a.article_id}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{a.title ?? '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {a.tags?.split(',').slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="mr-1 mb-1">{tag.trim()}</Badge>
                        ))}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-mono">{a.author_id ?? '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={a.alive ? 'default' : 'secondary'}>
                          {a.alive ? '正常' : '已删除'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatUTCToLocal(a.create_time)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/articles/${a.article_id}`)}
                            disabled={!isOwner}
                            title={isOwner ? '编辑' : '仅作者可编辑'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {a.alive ? (
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDeleteId(a.article_id ?? null)}
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => a.article_id && handleRecover(a.article_id)}
                              title="恢复"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          第 {(page - 1) * limit + 1} - {page * limit} 条
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            上一页
          </Button>
          <span className="text-sm font-medium px-2">第 {page} 页</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={articles.length < limit}
          >
            下一页
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除该文章吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
