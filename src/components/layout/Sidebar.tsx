import { NavLink } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  LogoutOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons'

const navItems = [
  { to: '/', label: '仪表盘', icon: DashboardOutlined },
  { to: '/users', label: '用户管理', icon: TeamOutlined },
  { to: '/articles', label: '文章管理', icon: FileTextOutlined },
  { to: '/checki', label: 'Checki 管理', icon: CheckSquareOutlined },
  { to: '/profile', label: '个人信息', icon: UserOutlined },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SafetyCertificateOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />
            <span className="text-lg font-bold text-sidebar-foreground">Blog Admin</span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-sidebar-accent lg:hidden">
            <CloseOutlined />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const IconComp = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
                  )
                }
              >
                <IconComp style={{ fontSize: 20 }} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <div className="mb-2 px-3 py-1.5 text-sm text-muted-foreground truncate">
            {user ? user.username : ''}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogoutOutlined style={{ fontSize: 20 }} />
            退出登录
          </button>
        </div>
      </aside>
    </>
  )
}
