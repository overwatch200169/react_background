import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MenuOutlined } from '@ant-design/icons'
import { Button } from 'antd'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          display: 'flex', alignItems: 'center', gap: 16,
          height: 64, borderBottom: '1px solid var(--color-border)', padding: '0 16px',
        }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          />
          <div style={{ fontSize: 18, fontWeight: 600 }} className="hidden sm:block">博客管理后台</div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
