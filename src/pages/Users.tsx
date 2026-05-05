import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Trash2, Loader2, UserPlus } from 'lucide-react'
import type { UserPublic, UserCreate, UserProfilePublic } from '@/types'

export default function Users() {
  const [users, setUsers] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [profile, setProfile] = useState<UserProfilePublic | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  // Create form
  const [form, setForm] = useState<UserCreate>({ username: '', email: '', password: '', level: 1 })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get<UserPublic[]>('/api/v1/users')
      setUsers(res.data)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async () => {
    setFormError('')
    setCreating(true)
    try {
      await api.post('/api/v1/users', form)
      setCreateOpen(false)
      setForm({ username: '', email: '', password: '', level: 1 })
      fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '创建失败'
      setFormError(msg)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/api/v1/users/${deleteId}`)
      setDeleteId(null)
      fetchUsers()
    } catch { /* ignore */ }
  }

  const openProfile = async (userId: number) => {
    setSelectedUserId(userId)
    setProfileOpen(true)
    try {
      const res = await api.get<UserProfilePublic>(`/api/v1/users/${userId}/profile`)
      setProfile(res.data)
    } catch {
      setProfile(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户账号</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          创建用户
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead className="hidden sm:table-cell">邮箱</TableHead>
                  <TableHead>等级</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">暂无用户数据</TableCell></TableRow>
                )}
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-mono">{u.user_id}</TableCell>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                    <TableCell><Badge variant="secondary">{u.level}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openProfile(u.user_id)}>
                          详情
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setDeleteId(u.user_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新用户</DialogTitle>
            <DialogDescription>填写信息以创建新的用户账号</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="c-username">用户名</Label>
              <Input id="c-username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-email">邮箱</Label>
              <Input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-password">密码</Label>
              <Input id="c-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-level">等级</Label>
              <Input id="c-level" type="number" value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除该用户吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>用户 ID: {selectedUserId}</DialogDescription>
          </DialogHeader>
          {profile ? (
            <div className="grid gap-3 py-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">用户 ID</span><span className="font-mono">{profile.user_id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">生日</span><span>{profile.birthday ?? '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">年龄</span><span>{profile.age ?? '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">简介</span><span className="max-w-[200px] truncate">{profile.bio ?? '-'}</span></div>
              {profile.avatar_url && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">头像</span>
                  <img src={profile.avatar_url} alt="avatar" className="h-10 w-10 rounded-full" />
                </div>
              )}
            </div>
          ) : (
            <p className="py-4 text-center text-muted-foreground">暂无资料信息</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
