import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Google Identity Services の読み込み
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => initGoogleAuth()
    document.body.appendChild(script)

    // ローカルストレージからセッション復元
    const savedUser = localStorage.getItem('missionboard_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  function initGoogleAuth() {
    window.google?.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    })
  }

  async function handleCredentialResponse(response) {
    // JWTデコード（簡易版）
    const payload = JSON.parse(atob(response.credential.split('.')[1]))
    
    // TODO: Phase 1でSheetsからrole情報を取得する
    // 現時点ではダミーのroleを設定
    const userData = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      role: 'parent', // TODO: Sheetsのusersシートから取得
    }

    setUser(userData)
    localStorage.setItem('missionboard_user', JSON.stringify(userData))
  }

  function signIn() {
    window.google?.accounts.id.prompt()
  }

  function signOut() {
    setUser(null)
    localStorage.removeItem('missionboard_user')
    window.google?.accounts.id.disableAutoSelect()
  }

  // 親子の役割を切り替え（開発・デモ用）
  function switchRole(role) {
    const updated = { ...user, role }
    setUser(updated)
    localStorage.setItem('missionboard_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
