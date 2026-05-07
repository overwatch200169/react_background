import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="articles" element={<Articles />} />
        <Route path="articles/new" element={<ArticleEdit />} />
        <Route path="articles/:id" element={<ArticleEdit />} />
        <Route path="checki" element={<Checki />} />
        <Route path="checki/new" element={<CheckiEdit />} />
        <Route path="checki/:id" element={<CheckiEdit />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#006B5E',
            borderRadius: 6,
          },
        }}
      >
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  )
}
