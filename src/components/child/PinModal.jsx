import { useState, useEffect } from 'react'

const PIN_LENGTH = 4
// ロックまでのミス回数
const MAX_MISS = 3
// ロック秒数
const LOCK_SECONDS = 30

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: '#fff',
    borderRadius: '20px',
    padding: '2rem 1.5rem 1.5rem',
    width: '100%',
    maxWidth: '320px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.35rem',
  },
  subtitle: {
    fontSize: '0.88rem',
    color: '#888',
    marginBottom: '1.5rem',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  dot: (filled) => ({
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: filled ? '#1976D2' : '#E0E0E0',
    border: `2px solid ${filled ? '#1976D2' : '#BDBDBD'}`,
    transition: 'background 0.15s',
  }),
  error: {
    background: '#FEEBEE',
    color: '#C62828',
    borderRadius: '8px',
    padding: '0.55rem 0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  lockMsg: {
    background: '#FFF3E0',
    color: '#E65100',
    borderRadius: '8px',
    padding: '0.55rem 0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.6rem',
    marginBottom: '0.6rem',
  },
  key: (disabled) => ({
    height: '64px',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    background: disabled ? '#F5F5F5' : '#F0F4FF',
    color: disabled ? '#BDBDBD' : '#1565C0',
    border: 'none',
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.12s',
    minHeight: 'unset',
  }),
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.6rem',
    marginBottom: '1rem',
  },
  emptyKey: {
    height: '64px',
  },
  delKey: (disabled) => ({
    height: '64px',
    fontSize: '1.2rem',
    background: disabled ? '#F5F5F5' : '#FFF3E0',
    color: disabled ? '#BDBDBD' : '#E65100',
    border: 'none',
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minHeight: 'unset',
  }),
  cancelBtn: {
    width: '100%',
    padding: '0.7rem',
    background: 'transparent',
    color: '#aaa',
    border: '1px solid #E0E0E0',
    borderRadius: '10px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    minHeight: 'unset',
  },
}

/**
 * PIN入力モーダル
 * Props:
 *   parentId  : string  -- localStorage キーに使う親ID
 *   onSuccess : fn      -- 正しいPIN入力時（または未設定時）に呼ぶ
 *   onClose   : fn      -- キャンセル時
 */
export default function PinModal({ parentId, onSuccess, onClose }) {
  const storageKey = `parent_pin_${parentId}`
  const savedPin = localStorage.getItem(storageKey)

  const [input, setInput] = useState('')
  const [missCount, setMissCount] = useState(0)
  const [lockRemain, setLockRemain] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  // PINが未設定なら即通過
  useEffect(() => {
    if (!savedPin) {
      onSuccess()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ロックカウントダウン
  useEffect(() => {
    if (lockRemain <= 0) return
    const timer = setTimeout(() => {
      setLockRemain(r => r - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [lockRemain])

  // ロック解除時にミスカウントリセット
  useEffect(() => {
    if (lockRemain === 0 && missCount >= MAX_MISS) {
      setMissCount(0)
      setErrorMsg('')
      setInput('')
    }
  }, [lockRemain]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLocked = lockRemain > 0
  const isDisabled = isLocked

  function pressKey(digit) {
    if (isDisabled || input.length >= PIN_LENGTH) return
    const next = input + digit
    setInput(next)
    setErrorMsg('')

    if (next.length === PIN_LENGTH) {
      // 判定
      if (next === savedPin) {
        onSuccess()
      } else {
        const newMiss = missCount + 1
        setMissCount(newMiss)
        setInput('')
        if (newMiss >= MAX_MISS) {
          setLockRemain(LOCK_SECONDS)
          setErrorMsg('')
        } else {
          setErrorMsg(`ちがうよ！もう一度いれてね（あと${MAX_MISS - newMiss}かいまちがえるとロックされるよ）`)
        }
      }
    }
  }

  function pressDelete() {
    if (isDisabled) return
    setInput(v => v.slice(0, -1))
    setErrorMsg('')
  }

  // PIN未設定なら何も描画しない（useEffect で即 onSuccess()）
  if (!savedPin) return null

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.title}>🔐 おやモードへ</div>
        <div style={styles.subtitle}>PINをいれてね</div>

        {/* 入力ドット */}
        <div style={styles.dots}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} style={styles.dot(i < input.length)} />
          ))}
        </div>

        {/* エラー・ロックメッセージ */}
        {isLocked && (
          <div style={styles.lockMsg}>
            🔒 {lockRemain}びょうまってね…
          </div>
        )}
        {!isLocked && errorMsg && (
          <div style={styles.error}>{errorMsg}</div>
        )}

        {/* テンキー 1〜9 */}
        <div style={styles.grid}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button
              key={n}
              style={styles.key(isDisabled)}
              onClick={() => pressKey(String(n))}
              disabled={isDisabled}
            >
              {n}
            </button>
          ))}
        </div>

        {/* 最下行: 空・0・削除 */}
        <div style={styles.bottomRow}>
          <div style={styles.emptyKey} />
          <button
            style={styles.key(isDisabled)}
            onClick={() => pressKey('0')}
            disabled={isDisabled}
          >
            0
          </button>
          <button
            style={styles.delKey(isDisabled)}
            onClick={pressDelete}
            disabled={isDisabled}
          >
            ⌫
          </button>
        </div>

        <button style={styles.cancelBtn} onClick={onClose}>
          キャンセル
        </button>
      </div>
    </div>
  )
}
