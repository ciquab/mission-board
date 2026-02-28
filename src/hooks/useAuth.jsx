import { createContext, useContext, useState, useEffect } from 'react'
import { setAccessToken, getUserByEmail, registerUser } from '../api/sheets'
import { initializeSpreadsheet } from '../utils/initSheets'

const AuthContext = createContext(null)

// Sheets API + ユーザー情報取得に必要なスコープ
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tokenClient, setTokenClient] = useState(null)
  // 新規ユーザーのロール設定が未完了の場合に使用
  const [pendingProfile, setPendingProfile] = useState(null)

  useEffect(() => {
    // ローカルストレージからセッションを復元
    const savedToken = localStorage.getItem('missionboard_token')
    const savedUser = localStorage.getItem('missionboard_user')
    if (savedToken && savedUser) {
      setAccessToken(savedToken)
      setUser(JSON.parse(savedUser))
    }

    // Google Identity Services スクリプトを動的に読み込む
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = initGoogleAuth
    document.body.appendChild(script)

    // トークン期限切れ時にログアウトさせる
    function handleTokenExpired() {
      console.warn('アクセストークンが期限切れです。再ログインしてください。')
      setUser(null)
      setAccessToken(null)
      localStorage.removeItem('missionboard_user')
      localStorage.removeItem('missionboard_token')
    }
    window.addEventListener('missionboard:token-expired', handleTokenExpired)

    setLoading(false)
    return () => {
      document.body.removeChild(script)
      window.removeEventListener('missionboard:token-expired', handleTokenExpired)
    }
  }, [])

  function initGoogleAuth() {
    // oauth2トークンクライアントを初期化（Sheets APIアクセス用）
    const client = window.google?.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: handleTokenResponse,
    })
    setTokenClient(client)
  }

  async function handleTokenResponse(tokenResponse) {
    if (tokenResponse.error) {
      console.error('OAuth2エラー:', tokenResponse.error)
      return
    }

    const token = tokenResponse.access_token
    setAccessToken(token)
    localStorage.setItem('missionboard_token', token)

    // Googleからユーザープロフィールを取得
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      console.error('ユーザー情報の取得に失敗しました')
      return
    }
    const profile = await res.json()

    // Sheetsからユーザー情報を検索
    let sheetsUser = null
    try {
      sheetsUser = await getUserByEmail(profile.email)
    } catch (e) {
      console.error('Sheetsのユーザー検索エラー:', e)
    }

    // スプレッドシートのヘッダー行を初期化（未設定の場合のみ書き込む）
    initializeSpreadsheet().catch(e => {
      console.warn('スプレッドシートの初期化に失敗（続行）:', e.message)
    })

    if (sheetsUser) {
      // 既存ユーザー：Sheetsのデータでセッションを設定
      const fullUser = buildUserObject(sheetsUser, profile.picture)
      setUser(fullUser)
      localStorage.setItem('missionboard_user', JSON.stringify(fullUser))
    } else {
      // 新規ユーザー：ロール選択画面に遷移させる
      setPendingProfile({
        sub: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      })
    }
  }

  /** 新規ユーザー登録の完了処理（ロール選択後に呼び出す） */
  async function completeRegistration(role, parentId = '') {
    if (!pendingProfile) return

    const newUser = {
      user_id: pendingProfile.sub,
      name: pendingProfile.name,
      role,
      email: pendingProfile.email,
      parent_id: parentId,
      push_endpoint: '',
      created_at: new Date().toISOString(),
    }

    await registerUser(newUser)

    const fullUser = buildUserObject(newUser, pendingProfile.picture)
    setUser(fullUser)
    localStorage.setItem('missionboard_user', JSON.stringify(fullUser))
    setPendingProfile(null)
  }

  function buildUserObject(sheetsUser, picture = '') {
    return {
      id: sheetsUser.user_id,
      name: sheetsUser.name,
      email: sheetsUser.email,
      picture,
      role: sheetsUser.role,
      parent_id: sheetsUser.parent_id,
    }
  }

  function signIn() {
    tokenClient?.requestAccessToken()
  }

  function signOut() {
    const token = localStorage.getItem('missionboard_token')
    if (token) {
      window.google?.accounts.oauth2.revoke(token)
    }
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('missionboard_user')
    localStorage.removeItem('missionboard_token')
  }

  /** 役割切り替え（開発・デモ用） */
  function switchRole(role) {
    const updated = { ...user, role }
    setUser(updated)
    localStorage.setItem('missionboard_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      switchRole,
      pendingProfile,
      completeRegistration,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
