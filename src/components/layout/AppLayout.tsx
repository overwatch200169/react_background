import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { MenuOutlined } from '@ant-design/icons'
import { Button, Segmented } from 'antd'
import { useTheme } from '@/lib/theme'
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons'

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mobile
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()
  const { theme, setTheme } = useTheme()

  // 移动端强制跟随系统
  useEffect(() => {
    if (isMobile && theme !== 'system') {
      setTheme('system')
    }
  }, [isMobile])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          height: 64, borderBottom: '1px solid var(--color-border)', padding: '0 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            />
            <div style={{ fontSize: 18, fontWeight: 600 }} className="hidden sm:block">博客管理后台</div>
          </div>

          {!isMobile && (
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
          )}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
