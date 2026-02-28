import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import ParentApp from './pages/ParentApp'
import ChildApp from './pages/ChildApp'
import LoginPage from './pages/LoginPage'
import RoleSetupPage from './pages/RoleSetupPage'

// 認証状態に応じてルーティング
function AppRoutes() {
  const { user, loading, pendingProfile } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>よみこみちゅう…</p>
      </div>
    )
  }

  // 新規ユーザーのロール設定が未完了
  if (pendingProfile) {
    return <RoleSetupPage />
  }

  if (!user) {
    return <LoginPage />
  }

  // 役割に応じてUIを切り替え
  return (
    <Routes>
      <Route path="/parent/*" element={
        user.role === 'parent' ? <ParentApp /> : <Navigate to="/child" />
      } />
      <Route path="/child/*" element={<ChildApp />} />
      <Route path="*" element={
        <Navigate to={user.role === 'parent' ? '/parent' : '/child'} />
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
