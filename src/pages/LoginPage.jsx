import { useAuth } from '../hooks/useAuth'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    background: 'linear-gradient(135deg, #2E75B6 0%, #1a4f8a 100%)',
    color: '#fff',
    textAlign: 'center',
  },
  logo: {
    fontSize: '4rem',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    opacity: 0.85,
    marginBottom: '3rem',
    lineHeight: 1.6,
  },
  card: {
    background: '#fff',
    color: '#333',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#2E75B6',
  },
  signInButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.85rem 1.5rem',
    background: '#fff',
    border: '2px solid #2E75B6',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#2E75B6',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
  },
  note: {
    fontSize: '0.78rem',
    color: '#999',
    marginTop: '1rem',
    lineHeight: 1.5,
  },
  errorBox: {
    background: '#fff3f3',
    border: '1.5px solid #e74c3c',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
    marginTop: '1rem',
    fontSize: '0.82rem',
    color: '#c0392b',
    textAlign: 'left',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
}

export default function LoginPage() {
  const { signIn, authError } = useAuth()

  return (
    <div style={styles.container}>
      <div style={styles.logo}>🏆</div>
      <h1 style={styles.title}>ミッションボード</h1>
      <p style={styles.subtitle}>
        親子でいっしょにタスクをかんりしよう！<br />
        やるべきことを「ミッション」に変えて<br />楽しく達成しよう。
      </p>

      <div style={styles.card}>
        <p style={styles.cardTitle}>ログインして始める</p>
        <button style={styles.signInButton} onClick={signIn}>
          <GoogleIcon />
          Googleでログイン
        </button>
        <p style={styles.note}>
          Googleアカウントを使ってログインします。<br />
          初回ログイン時はロールの設定が必要です。
        </p>
        {authError && (
          <div style={styles.errorBox}>
            ⚠️ {authError}
          </div>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
