import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { compressImage } from '@/lib/image-compress'
import { Button, Input, Card, Typography, Spin, message, Space, Upload } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { UserProfilePublic, UserUpdate, UserProfileUpdate } from '@/types'

const { Title, Text } = Typography

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const userId = user?.user_id

  const [profile, setProfile] = useState<UserProfilePublic | null>(null)
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userSaving, setUserSaving] = useState(false)

  const [bio, setBio] = useState('')
  const [birthday, setBirthday] = useState('')
  const [age, setAge] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    api.get<UserProfilePublic>(`/api/v1/users/${userId}/profile`)
      .then((r) => {
        setProfile(r.data)
        setBio(r.data.bio ?? '')
        setBirthday(r.data.birthday ? r.data.birthday.split('T')[0] : '')
        setAge(r.data.age != null ? String(r.data.age) : '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    setEmail(user?.email ?? '')
  }, [userId, user])

  const handleUpdateUser = async () => {
    if (!userId) return
    setUserSaving(true)
    try {
      const body: UserUpdate = { email }
      if (password) body.password = password
      await api.patch(`/api/v1/users/${userId}`, body)
      setPassword('')
      await refreshUser()
      message.success('保存成功')
    } catch {
      message.error('保存失败')
    } finally {
      setUserSaving(false)
    }
  }

  const handleUploadAvatar = async (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isImage) {
      message.error('只能上传图片文件')
      return Upload.LIST_IGNORE
    }
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB')
      return Upload.LIST_IGNORE
    }
    setAvatarUploading(true)
    try {
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append('file', compressed)
      const uploadRes = await api.post<{ url: string }>('/api/v1/file/upload?folder=avatars', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const avatarUrl = uploadRes.data.url
      const profileRes = await api.patch<UserProfilePublic>(`/api/v1/users/${userId}/profile`, {
        avatar_url: avatarUrl,
      })
      setProfile(profileRes.data)
      message.success('头像上传成功')
    } catch {
      message.error('头像上传失败')
    } finally {
      setAvatarUploading(false)
    }
    return false
  }

  const uploadProps: UploadProps = {
    name: 'file',
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: handleUploadAvatar,
  }



  const handleUpdateProfile = async () => {
    if (!userId) return
    setProfileSaving(true)
    try {
      const body: UserProfileUpdate = {
        bio: bio || null,
        birthday: birthday || null,
        age: age ? Number(age) : null,
      }
      await api.patch(`/api/v1/users/${userId}/profile`, body)
      message.success('保存成功')
    } catch {
      message.error('保存失败')
    } finally {
      setProfileSaving(false)
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      <div>
        <Title level={3} style={{ marginBottom: 0 }}>个人信息</Title>
        <Text type="secondary">管理你的账号与资料</Text>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="头像" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e4e4e7' }} />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(0,107,94,0.1)', color: '#006B5E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 'bold',
            }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{user?.username}</p>
            <Text type="secondary">ID: {user?.user_id} / 等级: {user?.level}</Text>
          </div>
        </div>
      </Card>

      <Card title="账号信息" extra={<Text type="secondary">修改邮箱和密码</Text>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>用户名</Text>
            <Input value={user?.username ?? ''} disabled />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>邮箱</Text>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>新密码</Text>
            <Input.Password
              placeholder="留空则不修改"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Space>
            <Button type="primary" onClick={handleUpdateUser} loading={userSaving} style={{ background: '#006B5E' }}>
              保存
            </Button>
          </Space>
        </div>
      </Card>

      <Card title="个人资料" extra={<Text type="secondary">修改简介、生日等信息</Text>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>个人简介</Text>
            <Input
              placeholder="介绍一下自己..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>生日</Text>
              <Input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>年龄</Text>
              <Input
                type="number"
                placeholder="年龄"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>头像</Text>
            <Upload {...uploadProps}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                border: '1px dashed #d9d9d9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: avatarUploading ? 'wait' : 'pointer',
                position: 'relative', background: '#fafafa', transition: 'border-color 0.3s',
                opacity: avatarUploading ? 0.6 : 1,
              }}>
                {avatarUploading ? (
                  <Spin size="small" />
                ) : profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="头像"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <UserOutlined style={{ fontSize: 28, color: '#bfbfbf' }} />
                )}
              </div>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
              点击上传头像（支持 JPG/PNG，不超过 2MB）
            </Text>
          </div>
          <Space>
            <Button type="primary" onClick={handleUpdateProfile} loading={profileSaving} style={{ background: '#006B5E' }}>
              保存
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}
