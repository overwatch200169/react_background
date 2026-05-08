import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Button, Card, Table, Tag, Space, Popconfirm, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { CheckiCount } from '@/types'

export default function Checki() {
  const navigate = useNavigate()
  const [items, setItems] = useState<CheckiCount[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await api.get<CheckiCount[]>('/api/v1/egg/checki')
      setItems(res.data)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleDelete = async (id: number | null) => {
    if (!id) return
    try {
      await api.patch('/api/v1/egg/checki', { cheki_count: 0 }, { params: { id } })
      fetchItems()
    } catch { /* ignore */ }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70, render: (v: number | null) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { title: '名称', dataIndex: 'name', render: (v: string | null) => v ?? '-' },
    {
      title: '次数', dataIndex: 'cheki_count', width: 100, align: 'center' as const,
      render: (v: number | null) => <Tag>{v ?? 0}</Tag>,
    },
    {
      title: '操作', width: 120, align: 'right' as const,
      render: (_: any, record: CheckiCount) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => record.id && navigate(`/checki/${record.id}`)}
          />
          <Popconfirm title="确定要删除该项目吗？" onConfirm={() => handleDelete(record.id)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
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
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Checki 管理</h1>
          <p style={{ color: 'var(--text-secondary)' }}>管理 Checki 打卡项目</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/checki/new')}>
          新建项目
        </Button>
      </div>

      <Card title="项目列表">
        <Spin spinning={loading}>
          <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: '暂无项目' }}
          />
        </Spin>
      </Card>
    </div>
  )
}
