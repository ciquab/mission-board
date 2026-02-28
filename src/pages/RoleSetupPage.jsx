import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserByEmail } from '../api/sheets'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    background: '#F5F7FA',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#2E75B6',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: '2rem',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  roleButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  roleButton: (selected) => ({
    padding: '1.5rem 1rem',
    border: `3px solid ${selected ? '#2E75B6' : '#ddd'}`,
    borderRadius: '12px',
    background: selected ? '#EBF2FA' : '#fff',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'border-color 0.2s, background 0.2s',
  }),
  roleEmoji: {
    fontSize: '2.5rem',
    display: 'block',
    marginBottom: '0.5rem',
  },
  roleLabel: (selected) => ({
    fontWeight: 'bold',
    color: selected ? '#2E75B6' : '#333',
  }),
  roleDesc: {
    fontSize: '0.78rem',
    color: '#888',
    marginTop: '0.25rem',
  },
  section: {
    marginTop: '1rem',
    padding: '1rem',
    background: '#F5F7FA',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.65rem 0.75rem',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
  },
  searchBtn: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    background: '#2E75B6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  parentFound: {
    marginTop: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: '#E8F5E9',
    borderRadius: '6px',
    color: '#2E7D32',
    fontSize: '0.85rem',
  },
  parentNotFound: {
    marginTop: '0.5rem',
    color: '#F44336',
    fontSize: '0.85rem',
  },
  submitBtn: {
    width: '100%',
    padding: '0.85rem',
    background: '#2E75B6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    color: '#F44336',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginTop: '0.5rem',
  },
}

export default function RoleSetupPage() {
  const { pendingProfile, completeRegistration } = useAuth()
  const [role, setRole] = useState('parent')
  const [parentEmail, setParentEmail] = useState('')
  const [parentUser, setParentUser] = useState(null)
  const [parentNotFound, setParentNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function searchParent() {
    setParentNotFound(false)
    setParentUser(null)
    if (!parentEmail.trim()) return

    try {
      const found = await getUserByEmail(parentEmail.trim())
      if (found && found.role === 'parent') {
        setParentUser(found)
      } else {
        setParentNotFound(true)
      }
    } catch {
      setParentNotFound(true)
    }
  }

  async function handleSubmit() {
    if (role === 'child' && !parentUser) {
      setError('おやのメールアドレスをかくにんしてください')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await completeRegistration(role, role === 'child' ? parentUser.user_id : '')
    } catch (e) {
      setError('とうろくに失敗しました。もう一度お試しください。')
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>ようこそ！</h1>
        <p style={styles.subtitle}>
          {pendingProfile?.name} さん、はじめまして！<br />
          あなたの役割を選んでください。
        </p>

        <div style={styles.roleButtons}>
          <button style={styles.roleButton(role === 'parent')} onClick={() => setRole('parent')}>
            <span style={styles.roleEmoji}>👨‍👩‍👧</span>
            <div style={styles.roleLabel(role === 'parent')}>おやモード</div>
            <div style={styles.roleDesc}>タスクを作って<br />子どもを管理</div>
          </button>
          <button style={styles.roleButton(role === 'child')} onClick={() => setRole('child')}>
            <span style={styles.roleEmoji}>⭐</span>
            <div style={styles.roleLabel(role === 'child')}>こどもモード</div>
            <div style={styles.roleDesc}>ミッションに<br />チャレンジ！</div>
          </button>
        </div>

        {role === 'child' && (
          <div style={styles.section}>
            <label style={styles.label}>おやのメールアドレス</label>
            <input
              style={styles.input}
              type="email"
              placeholder="parent@example.com"
              value={parentEmail}
              onChange={e => {
                setParentEmail(e.target.value)
                setParentUser(null)
                setParentNotFound(false)
              }}
            />
            <button style={styles.searchBtn} onClick={searchParent}>けんさく</button>
            {parentUser && (
              <div style={styles.parentFound}>
                ✅ {parentUser.name} さんのアカウントが見つかりました
              </div>
            )}
            {parentNotFound && (
              <div style={styles.parentNotFound}>
                おやのアカウントが見つかりませんでした
              </div>
            )}
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'とうろくちゅう…' : 'この役割で始める'}
        </button>
      </div>
    </div>
  )
}
