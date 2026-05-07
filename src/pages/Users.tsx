import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button, Card, Table, Tag, Space, Modal, Input, Form, Popconfirm, Spin, message } from 'antd'
import { PlusOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons'
import type { UserPublic, UserCreate, UserProfilePublic } from '@/types'

export default function Users() {
  const [users, setUsers] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [profile, setProfile] = useState<UserProfilePublic | null>(null)

  const [form] = Form.useForm()
  const [creating, setCreating] = useState(false)

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
    try {
      const values = await form.validateFields()
      setCreating(true)
      await api.post('/api/v1/users', values)
      setCreateOpen(false)
      form.resetFields()
      fetchUsers()
      message.success('用户创建成功')
    } catch (err: any) {
      if (err.errorFields) return
      message.error(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (userId: number) => {
    try {
      await api.delete(`/api/v1/users/${userId}`)
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

  const columns = [
    { title: 'ID', dataIndex: 'user_id', width: 70, render: (v: number) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email', responsive: ['sm'] as any },
    { title: '等级', dataIndex: 'level', width: 80, render: (v: number) => <Tag>{v}</Tag> },
    {
      title: '操作', width: 140,
      render: (_: any, record: UserPublic) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => openProfile(record.user_id)}>详情</Button>
          <Popconfirm title="确定要删除该用户吗？" onConfirm={() => handleDelete(record.user_id)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>用户管理</h1>
          <p style={{ color: '#71717a' }}>管理系统用户账号</p>
        </div>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setCreateOpen(true)} style={{ background: '#006B5E' }}>
          创建用户
        </Button>
      </div>

      <Card title="用户列表">
        <Spin spinning={loading}>
          <Table
            dataSource={users}
            columns={columns}
            rowKey="user_id"
            pagination={false}
            locale={{ emptyText: '暂无用户数据' }}
          />
        </Spin>
      </Card>

      <Modal
        title="创建新用户"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields() }}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
        confirmLoading={creating}
        okButtonProps={{ style: { background: '#006B5E' } }}
      >
        <Form form={form} layout="vertical" initialValues={{ level: 1 }}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, min: 8, message: '密码至少8位' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="等级" name="level">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`用户详情 (ID: ${selectedUserId})`}
        open={profileOpen}
        onCancel={() => setProfileOpen(false)}
        footer={null}
      >
        {profile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>用户 ID</span>
              <span style={{ fontFamily: 'monospace' }}>{profile.user_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>生日</span>
              <span>{profile.birthday ?? '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>年龄</span>
              <span>{profile.age ?? '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>简介</span>
              <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.bio ?? '-'}</span>
            </div>
            {profile.avatar_url && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#71717a' }}>头像</span>
                <img src={profile.avatar_url} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              </div>
            )}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#71717a', padding: 16 }}>暂无资料信息</p>
        )}
      </Modal>
    </div>
  )
}
