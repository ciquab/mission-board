import { useState, useEffect } from 'react'
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
      <Route path="/child/*" element={
        user.role === 'parent' ? <Navigate to="/parent" /> : <ChildApp />
      } />
      <Route path="*" element={
        <Navigate to={user.role === 'parent' ? '/parent' : '/child'} />
      } />
    </Routes>
  )
}

// PWAインストール促進バナー
function InstallBanner() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      // ブラウザのデフォルトプロンプトを抑制して自前で管理
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => setInstallPrompt(null)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  if (!installPrompt || dismissed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#2E75B6', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
      zIndex: 9999,
      gap: '0.75rem',
    }}>
      <span style={{ fontSize: '0.9rem', flex: 1 }}>
        📱 ホーム画面に追加してかんたんアクセス！
      </span>
      <button
        onClick={handleInstall}
        style={{
          padding: '0.5rem 1rem',
          background: '#fff',
          color: '#2E75B6',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          minHeight: 'auto',
        }}
      >
        追加する
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="閉じる"
        style={{
          padding: '0.4rem',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '1rem',
          cursor: 'pointer',
          lineHeight: 1,
          minHeight: 'auto',
        }}
      >
        ✕
      </button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppRoutes />
        <InstallBanner />
      </AuthProvider>
    </BrowserRouter>
  )
}
