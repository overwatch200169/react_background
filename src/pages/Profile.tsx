import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import type { UserProfilePublic, UserUpdate, UserProfileUpdate } from '@/types'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const userId = user?.user_id

  const [profile, setProfile] = useState<UserProfilePublic | null>(null)
  const [loading, setLoading] = useState(true)

  // User info form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userSaving, setUserSaving] = useState(false)
  const [userMsg, setUserMsg] = useState('')

  // Profile form
  const [bio, setBio] = useState('')
  const [birthday, setBirthday] = useState('')
  const [age, setAge] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    api.get<UserProfilePublic>(`/api/v1/users/${userId}/profile`)
      .then((r) => {
        setProfile(r.data)
        setBio(r.data.bio ?? '')
        setBirthday(r.data.birthday ? r.data.birthday.split('T')[0] : '')
        setAge(r.data.age != null ? String(r.data.age) : '')
        setAvatarUrl(r.data.avatar_url ?? '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    setEmail(user?.email ?? '')
  }, [userId, user])

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserMsg('')
    if (!userId) return
    setUserSaving(true)
    try {
      const body: UserUpdate = { email }
      if (password) body.password = password
      await api.patch(`/api/v1/users/${userId}`, body)
      setPassword('')
      await refreshUser()
      setUserMsg('保存成功')
    } catch {
      setUserMsg('保存失败')
    } finally {
      setUserSaving(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg('')
    if (!userId) return
    setProfileSaving(true)
    try {
      const body: UserProfileUpdate = {
        bio: bio || null,
        birthday: birthday || null,
        age: age ? Number(age) : null,
        avatar_url: avatarUrl || null,
      }
      await api.patch(`/api/v1/users/${userId}/profile`, body)
      setProfileMsg('保存成功')
    } catch {
      setProfileMsg('保存失败')
    } finally {
      setProfileSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">个人信息</h1>
        <p className="text-muted-foreground">管理你的账号与资料</p>
      </div>

      {/* Avatar */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="头像" className="h-16 w-16 rounded-full object-cover border" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold">{user?.username}</p>
            <p className="text-sm text-muted-foreground">ID: {user?.user_id} / 等级: {user?.level}</p>
          </div>
        </CardContent>
      </Card>

      {/* Update User Info */}
      <Card>
        <CardHeader>
          <CardTitle>账号信息</CardTitle>
          <CardDescription>修改邮箱和密码</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" value={user?.username ?? ''} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">新密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="留空则不修改"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={userSaving}>
                {userSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
              {userMsg && <span className={`text-sm ${userMsg === '保存成功' ? 'text-emerald-600' : 'text-destructive'}`}>{userMsg}</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Update User Profile */}
      <Card>
        <CardHeader>
          <CardTitle>个人资料</CardTitle>
          <CardDescription>修改简介、生日等信息</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="bio">个人简介</Label>
              <Input
                id="bio"
                placeholder="介绍一下自己..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="birthday">生日</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">年龄</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="年龄"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="avatarUrl">头像链接</Label>
              <Input
                id="avatarUrl"
                placeholder="输入头像图片 URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={profileSaving}>
                {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
              {profileMsg && <span className={`text-sm ${profileMsg === '保存成功' ? 'text-emerald-600' : 'text-destructive'}`}>{profileMsg}</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
