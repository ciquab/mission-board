import { useState } from 'react'

const PIN_LENGTH = 4

const styles = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '1.25rem',
  },
  cardTitle: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  statusBadge: (set) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    background: set ? '#E8F5E9' : '#F5F5F5',
    color: set ? '#2E7D32' : '#888',
    borderRadius: '999px',
    padding: '0.3rem 0.8rem',
    fontSize: '0.82rem',
    fontWeight: 'bold',
  }),
  btn: (variant) => {
    const variants = {
      primary: { background: '#2E75B6', color: '#fff' },
      danger: { background: '#F44336', color: '#fff' },
      default: { background: '#F0F4FF', color: '#1565C0' },
    }
    return {
      padding: '0.45rem 1rem',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.82rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      minHeight: 'unset',
      ...(variants[variant] || variants.default),
    }
  },
  form: {
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  label: {
    fontSize: '0.83rem',
    color: '#555',
    marginBottom: '0.25rem',
  },
  pinInput: {
    width: '100%',
    padding: '0.6rem 0.85rem',
    border: '1.5px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '1rem',
    letterSpacing: '0.3em',
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    background: '#FEEBEE',
    color: '#C62828',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    fontSize: '0.82rem',
  },
  success: {
    background: '#E8F5E9',
    color: '#2E7D32',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    fontSize: '0.82rem',
  },
  formBtns: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  hint: {
    fontSize: '0.78rem',
    color: '#aaa',
    lineHeight: 1.5,
  },
}

/**
 * PIN設定カード（親ダッシュボード用）
 * Props:
 *   parentId : string
 */
export default function PinSettings({ parentId }) {
  const storageKey = `parent_pin_${parentId}`

  const [savedPin, setSavedPin] = useState(() => localStorage.getItem(storageKey))
  const [mode, setMode] = useState('view') // 'view' | 'set' | 'change' | 'remove'
  const [inputPin, setInputPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function resetForm() {
    setInputPin('')
    setConfirmPin('')
    setErrorMsg('')
    setSuccessMsg('')
  }

  function handleSave() {
    setErrorMsg('')
    if (inputPin.length !== PIN_LENGTH || !/^\d{4}$/.test(inputPin)) {
      setErrorMsg('4けたの数字でいれてください')
      return
    }
    if (inputPin !== confirmPin) {
      setErrorMsg('2回いれたPINがちがいます')
      return
    }
    localStorage.setItem(storageKey, inputPin)
    setSavedPin(inputPin)
    setSuccessMsg('PINを保存しました ✅')
    setMode('view')
    resetForm()
  }

  function handleRemove() {
    if (!confirm('PINを削除しますか？\n削除すると子どもが確認なしで親モードに入れるようになります。')) return
    localStorage.removeItem(storageKey)
    setSavedPin(null)
    setSuccessMsg('PINを削除しました')
    setMode('view')
    resetForm()
  }

  function handleCancel() {
    setMode('view')
    resetForm()
  }

  // 数字のみ・4桁まで制限
  function handlePinInput(setter) {
    return (e) => {
      const v = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH)
      setter(v)
      setErrorMsg('')
    }
  }

  const isSet = !!savedPin

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>おやモードへの切り替えPIN</div>

      {/* ステータス表示 */}
      <div style={styles.row}>
        <span style={styles.statusBadge(isSet)}>
          {isSet ? '🔐 PIN設定済み' : '🔓 PIN未設定'}
        </span>

        {mode === 'view' && (
          <>
            {!isSet && (
              <button style={styles.btn('primary')} onClick={() => setMode('set')}>
                PINを設定する
              </button>
            )}
            {isSet && (
              <>
                <button style={styles.btn('default')} onClick={() => setMode('change')}>
                  変更する
                </button>
                <button style={styles.btn('danger')} onClick={handleRemove}>
                  削除する
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* 成功メッセージ */}
      {successMsg && mode === 'view' && (
        <div style={{ ...styles.success, marginTop: '0.75rem' }}>{successMsg}</div>
      )}

      {/* ヒント文 */}
      {mode === 'view' && (
        <div style={{ ...styles.hint, marginTop: '0.6rem' }}>
          {isSet
            ? '子どもが「おやモードへ」ボタンを押すとPIN入力が求められます。'
            : 'PINを設定すると、子どもが勝手に親モードに切り替えられなくなります。'}
        </div>
      )}

      {/* 設定・変更フォーム */}
      {(mode === 'set' || mode === 'change') && (
        <div style={styles.form}>
          <div>
            <div style={styles.label}>
              {mode === 'change' ? '新しいPIN（4けた）' : 'PIN（4けた）'}
            </div>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={PIN_LENGTH}
              placeholder="••••"
              style={styles.pinInput}
              value={inputPin}
              onChange={handlePinInput(setInputPin)}
              autoFocus
            />
          </div>
          <div>
            <div style={styles.label}>確認（もう一度）</div>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={PIN_LENGTH}
              placeholder="••••"
              style={styles.pinInput}
              value={confirmPin}
              onChange={handlePinInput(setConfirmPin)}
            />
          </div>
          {errorMsg && <div style={styles.error}>{errorMsg}</div>}
          <div style={styles.formBtns}>
            <button style={styles.btn('default')} onClick={handleCancel}>
              キャンセル
            </button>
            <button
              style={styles.btn('primary')}
              onClick={handleSave}
              disabled={inputPin.length < PIN_LENGTH || confirmPin.length < PIN_LENGTH}
            >
              保存する
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
