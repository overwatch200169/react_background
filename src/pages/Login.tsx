import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Spin } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.username, values.password)
      navigate('/')
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        message.error('用户名或密码错误')
      } else {
        message.error('登录失败，请检查网络连接')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdfb 0%, #ccfbf1 100%)',
      padding: '1rem',
    }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            margin: '0 auto 12px',
            width: 48, height: 48,
            borderRadius: '50%',
            background: 'rgba(0,107,94,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SafetyCertificateOutlined style={{ fontSize: 28, color: '#006B5E' }} />
          </div>
          <Title level={3} style={{ marginBottom: 4 }}>博客管理后台</Title>
          <Text type="secondary">请输入账号密码登录</Text>
        </div>
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} >
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={loading} style={{ background: '#006B5E' }}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  )
}
