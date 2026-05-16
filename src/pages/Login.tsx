import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Typography, message, Spin, Segmented } from 'antd'
import { SafetyCertificateOutlined, SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mobile
}

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { login } = useAuth()
  const isMobile = useIsMobile()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (isMobile && theme !== 'system') {
      setTheme('system')
    }
  }, [isMobile])
  const navigate = useNavigate()

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.username, values.password)
      navigate('/')
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
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
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--color-background) 0%, var(--color-secondary) 100%)',
      padding: '1rem',
      position: 'relative',
    }}>
      {!isMobile && (
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <Segmented
            size="small"
            value={theme}
            onChange={(val) => setTheme(val as 'light' | 'dark' | 'system')}
            options={[
              { label: <SunOutlined />, value: 'light' },
              { label: <MoonOutlined />, value: 'dark' },
              { label: <DesktopOutlined />, value: 'system' },
            ]}
          />
        </div>
      )}
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            margin: '0 auto 12px',
            width: 48, height: 48,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SafetyCertificateOutlined style={{ fontSize: 28, color: 'var(--color-primary)' }} />
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
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  )
}
