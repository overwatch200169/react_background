import { Outlet, Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Spin, ConfigProvider } from 'antd'
import { AuthProvider, useAuth } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Users from '@/pages/Users'
import Articles from '@/pages/Articles'
import ArticleEdit from '@/pages/ArticleEdit'
import Checki from '@/pages/Checki'
import CheckiEdit from '@/pages/CheckiEdit'
import Profile from '@/pages/Profile'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#006B5E',
            borderRadius: 6,
          },
        }}
      >
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </ConfigProvider>
    ),
    children: [
      {
        path: 'login',
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },
      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'users', element: <Users /> },
          { path: 'articles', element: <Articles /> },
          { path: 'articles/new', element: <ArticleEdit /> },
          { path: 'articles/:id', element: <ArticleEdit /> },
          { path: 'checki', element: <Checki /> },
          { path: 'checki/new', element: <CheckiEdit /> },
          { path: 'checki/:id', element: <CheckiEdit /> },
          { path: 'profile', element: <Profile /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
