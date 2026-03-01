import { useState, useEffect } from 'react'

const TIME_BLOCKS = [
  { value: 'morning', label: '🌅 朝' },
  { value: 'afternoon', label: '☀️ 昼' },
  { value: 'evening', label: '🌇 夕方' },
  { value: 'night', label: '🌙 夜' },
  { value: 'bedtime', label: '🛏 就寝前' },
]

const ICONS = ['📚', '🖊️', '🧹', '🍳', '🏃', '🎮', '🎨', '🎵', '🐕', '🌿', '🧺', '🦷', '🛁', '💤', '⭐']

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: 'bold',
    color: '#2E75B6',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#999',
    padding: '0.25rem',
    minHeight: 'auto',
    minWidth: 'auto',
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.35rem',
  },
  required: {
    color: '#F44336',
    marginLeft: '2px',
  },
  input: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '70px',
  },
  select: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    fontSize: '0.9rem',
    background: '#fff',
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '0.35rem',
    marginTop: '0.35rem',
  },
  iconBtn: (selected) => ({
    padding: '0.4rem',
    border: `2px solid ${selected ? '#2E75B6' : '#eee'}`,
    borderRadius: '6px',
    background: selected ? '#EBF2FA' : '#fff',
    cursor: 'pointer',
    fontSize: '1.2rem',
    textAlign: 'center',
    minHeight: 'auto',
    minWidth: 'auto',
  }),
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem',
  },
  cancelBtn: {
    flex: 1,
    padding: '0.75rem',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    color: '#666',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 2,
    padding: '0.75rem',
    background: '#2E75B6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
}

const defaultForm = {
  title: '',
  description: '',
  type: 'routine',
  recurrence: 'daily',
  time_block: 'morning',
  assigned_to: '',
  point_value: '3',
  require_approval: false,
  icon: '⭐',
}

export default function TaskForm({ initialData, children, onSubmit, onClose, submitting }) {
  const [form, setForm] = useState(() => initialData
    ? { ...defaultForm, ...initialData }
    : defaultForm
  )

  // 子どもの一覧（Sheetsから取得済みのものを渡してもらう）
  const childList = children || []

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit(form)
  }

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <form style={styles.modal} onSubmit={handleSubmit}>
        <div style={styles.header}>
          <span style={styles.title}>{initialData ? 'タスクを編集' : '新しいタスクを作成'}</span>
          <button type="button" style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* タイトル */}
        <div style={styles.field}>
          <label style={styles.label}>タイトル<span style={styles.required}>*</span></label>
          <input
            style={styles.input}
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="例：歯みがきをする"
            required
          />
        </div>

        {/* アイコン */}
        <div style={styles.field}>
          <label style={styles.label}>アイコン</label>
          <div style={styles.iconGrid}>
            {ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                style={styles.iconBtn(form.icon === icon)}
                onClick={() => set('icon', icon)}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* 説明 */}
        <div style={styles.field}>
          <label style={styles.label}>説明（任意）</label>
          <textarea
            style={styles.textarea}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="タスクの詳細を入力..."
          />
        </div>

        <div style={styles.row}>
          {/* タスク種別 */}
          <div style={styles.field}>
            <label style={styles.label}>種別</label>
            <select style={styles.select} value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="routine">ルーティン（定期）</option>
              <option value="spot">スポット（突発）</option>
            </select>
          </div>

          {/* 繰り返し */}
          {form.type === 'routine' && (
            <div style={styles.field}>
              <label style={styles.label}>繰り返し</label>
              <select style={styles.select} value={form.recurrence} onChange={e => set('recurrence', e.target.value)}>
                <option value="daily">毎日</option>
                <option value="weekly">毎週</option>
                <option value="custom">カスタム</option>
              </select>
            </div>
          )}
        </div>

        {/* 時間帯 */}
        <div style={styles.field}>
          <label style={styles.label}>時間帯</label>
          <select style={styles.select} value={form.time_block} onChange={e => set('time_block', e.target.value)}>
            {TIME_BLOCKS.map(tb => (
              <option key={tb.value} value={tb.value}>{tb.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.row}>
          {/* 担当者 */}
          <div style={styles.field}>
            <label style={styles.label}>担当する子ども</label>
            {childList.length > 0 ? (
              <select style={styles.select} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                <option value="">選択してください</option>
                {childList.map(child => (
                  <option key={child.user_id} value={child.user_id}>{child.name}</option>
                ))}
              </select>
            ) : (
              <input
                style={styles.input}
                value={form.assigned_to}
                onChange={e => set('assigned_to', e.target.value)}
                placeholder="ユーザーID"
              />
            )}
          </div>

          {/* ポイント */}
          <div style={styles.field}>
            <label style={styles.label}>ポイント（1〜5）</label>
            <select style={styles.select} value={form.point_value} onChange={e => set('point_value', e.target.value)}>
              {[1, 2, 3, 4, 5].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 承認必要 */}
        <div style={{ ...styles.field, marginBottom: '0' }}>
          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={form.require_approval}
              onChange={e => set('require_approval', e.target.checked)}
            />
            <span>完了時に親の承認が必要</span>
          </label>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.cancelBtn} onClick={onClose}>キャンセル</button>
          <button
            type="submit"
            style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
            disabled={submitting}
          >
            {submitting ? '保存中…' : (initialData ? '更新する' : '作成する')}
          </button>
        </div>
      </form>
    </div>
  )
}
