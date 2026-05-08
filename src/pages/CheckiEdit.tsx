import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/lib/api'
import { Button, Input, Card, Typography, Space, message, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import type { CheckiCount } from '@/types'

const { Title, Text } = Typography

export default function CheckiEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [name, setName] = useState('')
  const [count, setCount] = useState('0')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew) {
      setLoading(true)
      api.get<CheckiCount[]>('/api/v1/egg/checki')
        .then((r) => {
          const item = r.data.find((i) => i.id === Number(id))
          if (item) {
            setName(item.name ?? '')
            setCount(String(item.cheki_count ?? 0))
          } else {
            message.error('未找到该项目')
          }
        })
        .catch(() => message.error('加载失败'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew])

  const handleSubmit = async () => {
    if (!name && isNew) {
      message.warning('请填写项目名称')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        await api.post('/api/v1/egg/checki', { name, cheki_count: Number(count) || 0 })
      } else {
        await api.patch('/api/v1/egg/checki', { cheki_count: Number(count) || 0 }, { params: { id } })
      }
      navigate('/checki')
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
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/checki')} />
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>{isNew ? '新建项目' : '编辑项目'}</Title>
          <Text type="secondary">{isNew ? '创建一个新的 Checki 打卡项目' : '修改打卡项目信息'}</Text>
        </div>
      </div>

      <Card title={isNew ? '创建项目' : '编辑内容'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>项目名称</Text>
            <Input
              placeholder="请输入项目名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isNew}
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>打卡次数</Text>
            <Input
              type="number"
              min={0}
              placeholder="请输入打卡次数"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>

          <Space>
            <Button onClick={() => navigate('/checki')}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={saving}>
              {isNew ? '创建' : '保存'}
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}
