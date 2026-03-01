import { useState } from 'react'

const ICONS = ['📚', '🖊️', '🧹', '🍳', '🏃', '🎮', '🎨', '🎵', '🐕', '🌿', '🧺', '🦷', '🛁', '💤', '⭐', '💡']

const TIME_BLOCKS = [
  { value: 'morning', label: '🌅 あさ' },
  { value: 'afternoon', label: '☀️ ひる' },
  { value: 'evening', label: '🌇 ゆうがた' },
  { value: 'night', label: '🌙 よる' },
  { value: 'bedtime', label: '🛏 ねるまえ' },
]

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  sheet: {
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    padding: '1.5rem',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
  },
  handle: {
    width: '40px',
    height: '4px',
    background: '#ddd',
    borderRadius: '2px',
    margin: '0 auto 1.25rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#2E75B6',
    marginBottom: '1.25rem',
    textAlign: 'center',
  },
  field: {
    marginBottom: '1.1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.4rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #ddd',
    borderRadius: '10px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #ddd',
    borderRadius: '10px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '0.4rem',
  },
  iconBtn: (selected) => ({
    padding: '0.5rem',
    border: `2px solid ${selected ? '#2E75B6' : '#eee'}`,
    borderRadius: '8px',
    background: selected ? '#EBF2FA' : '#fff',
    cursor: 'pointer',
    fontSize: '1.4rem',
    textAlign: 'center',
    minHeight: 'auto',
    minWidth: 'auto',
  }),
  timeBlocks: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  timeBtn: (selected) => ({
    padding: '0.5rem 0.85rem',
    border: `2px solid ${selected ? '#2E75B6' : '#ddd'}`,
    borderRadius: '999px',
    background: selected ? '#EBF2FA' : '#fff',
    color: selected ? '#2E75B6' : '#555',
    fontWeight: selected ? 'bold' : 'normal',
    cursor: 'pointer',
    fontSize: '0.85rem',
    minHeight: 'auto',
    whiteSpace: 'nowrap',
  }),
  typeToggle: {
    display: 'flex',
    gap: '0.5rem',
  },
  typeBtn: (selected) => ({
    flex: 1,
    padding: '0.6rem',
    border: `2px solid ${selected ? '#2E75B6' : '#ddd'}`,
    borderRadius: '10px',
    background: selected ? '#EBF2FA' : '#fff',
    color: selected ? '#2E75B6' : '#555',
    fontWeight: selected ? 'bold' : 'normal',
    cursor: 'pointer',
    fontSize: '0.9rem',
    minHeight: 'auto',
    textAlign: 'center',
  }),
  submitBtn: {
    width: '100%',
    padding: '1rem',
    background: '#2E75B6',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  cancelBtn: {
    width: '100%',
    padding: '0.75rem',
    background: 'none',
    color: '#aaa',
    border: 'none',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    color: '#F44336',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
}

export default function ProposalForm({ onSubmit, onClose, submitting }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('⭐')
  const [timeBlock, setTimeBlock] = useState('morning')
  const [isRoutine, setIsRoutine] = useState(true)
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!title.trim()) {
      setError('タイトルを入力してね！')
      return
    }
    setError('')
    onSubmit({
      title,
      description,
      icon,
      time_block: timeBlock,
      type: isRoutine ? 'routine' : 'spot',
      recurrence: isRoutine ? 'daily' : '',
    })
  }

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.sheet}>
        <div style={styles.handle} />
        <h2 style={styles.title}>あたらしいミッションをていあん</h2>

        <div style={styles.field}>
          <label style={styles.label}>ミッションのなまえ</label>
          <input
            style={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例：じぶんのへやをかたづける"
            autoFocus
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>アイコン</label>
          <div style={styles.iconGrid} className="icon-grid">
            {ICONS.map(ic => (
              <button
                key={ic}
                type="button"
                style={styles.iconBtn(icon === ic)}
                onClick={() => setIcon(ic)}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>まいにちやる？</label>
          <div style={styles.typeToggle}>
            <button type="button" style={styles.typeBtn(isRoutine)} onClick={() => setIsRoutine(true)}>
              🔄 まいにちやる
            </button>
            <button type="button" style={styles.typeBtn(!isRoutine)} onClick={() => setIsRoutine(false)}>
              1️⃣ いちどだけ
            </button>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>いつやる？</label>
          <div style={styles.timeBlocks}>
            {TIME_BLOCKS.map(tb => (
              <button
                key={tb.value}
                type="button"
                style={styles.timeBtn(timeBlock === tb.value)}
                onClick={() => setTimeBlock(tb.value)}
              >
                {tb.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>くわしく（任意）</label>
          <textarea
            style={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="どんなミッションか教えてね"
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'おくりちゅう…' : 'ていあんする！'}
        </button>
        <button style={styles.cancelBtn} onClick={onClose}>
          やめる
        </button>
      </div>
    </div>
  )
}
