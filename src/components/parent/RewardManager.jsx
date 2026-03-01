import { useState, useEffect, useCallback } from 'react'
import {
  getAllRewardsByParent,
  createReward,
  updateReward,
  updateRewardStatus,
  archiveReward,
} from '../../api/sheets'

const styles = {
  container: {},
  addBtn: {
    width: '100%',
    padding: '0.85rem',
    background: '#2E75B6',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.65rem',
    marginTop: '0.5rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    marginBottom: '1.5rem',
  },
  card: (status) => ({
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    border: status === 'pending' ? '2px solid #F44336' : '2px solid transparent',
  }),
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: '0.95rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.2rem',
    wordBreak: 'break-word',
  },
  cardMeta: {
    fontSize: '0.8rem',
    color: '#888',
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  cost: {
    color: '#FFB300',
    fontWeight: 'bold',
  },
  statusBadge: (status) => ({
    display: 'inline-block',
    fontSize: '0.72rem',
    background: status === 'pending' ? '#FEEBEE' : status === 'redeemed' ? '#E8F5E9' : '#f0f0f0',
    color: status === 'pending' ? '#C62828' : status === 'redeemed' ? '#2E7D32' : '#888',
    border: `1px solid ${status === 'pending' ? '#FFCDD2' : status === 'redeemed' ? '#C8E6C9' : '#ddd'}`,
    borderRadius: '999px',
    padding: '0.15rem 0.55rem',
  }),
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap',
  },
  approveBtn: {
    padding: '0.45rem 1rem',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    minHeight: 'auto',
  },
  rejectBtn: {
    padding: '0.45rem 1rem',
    background: '#fff',
    color: '#F44336',
    border: '1px solid #F44336',
    borderRadius: '6px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    minHeight: 'auto',
  },
  editBtn: {
    padding: '0.45rem 0.75rem',
    background: '#fff',
    color: '#2E75B6',
    border: '1px solid #2E75B6',
    borderRadius: '6px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    minHeight: 'auto',
  },
  deleteBtn: {
    padding: '0.45rem 0.75rem',
    background: '#fff',
    color: '#bbb',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    minHeight: 'auto',
    marginLeft: 'auto',
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    padding: '2rem 1rem',
    fontSize: '0.9rem',
    lineHeight: 1.7,
  },
  error: {
    background: '#FEEBEE',
    color: '#C62828',
    padding: '0.65rem 0.9rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '0.75rem',
  },
  // 作成フォームオーバーレイ
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '85vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '1.25rem',
    color: '#333',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.82rem',
    color: '#555',
    marginBottom: '0.35rem',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    background: '#fff',
    outline: 'none',
  },
  formRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  submitBtn: {
    width: '100%',
    padding: '0.9rem',
    background: '#2E75B6',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  cancelBtn: {
    width: '100%',
    padding: '0.75rem',
    background: '#f5f5f5',
    color: '#555',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
}

const POINT_OPTIONS = [5, 10, 20, 30, 50, 100]

/**
 * 親用ご褒美管理コンポーネント
 * @param {string} parentId - 親のユーザーID
 * @param {Object[]} children - 子どもリスト（user_id, name）
 */
export default function RewardManager({ parentId, children }) {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingReward, setEditingReward] = useState(null) // 編集中のご褒美
  const [submitting, setSubmitting] = useState(false)
  const [processing, setProcessing] = useState(null)

  // フォームの状態
  const [form, setForm] = useState({
    title: '',
    point_cost: '10',
    assigned_to: children[0]?.user_id || '',
  })

  const loadRewards = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllRewardsByParent(parentId)
      // active / pending / redeemed のみ（archived は除外）
      setRewards(data.filter(r => r.status !== 'archived'))
    } catch (e) {
      setError('ご褒美データの読み込みに失敗しました。' + e.message)
    } finally {
      setLoading(false)
    }
  }, [parentId])

  useEffect(() => { loadRewards() }, [loadRewards])

  function openForm() {
    setEditingReward(null)
    setForm({
      title: '',
      point_cost: '10',
      assigned_to: children[0]?.user_id || '',
    })
    setShowForm(true)
  }

  function openEditForm(reward) {
    setEditingReward(reward)
    setForm({
      title: reward.title,
      point_cost: String(reward.point_cost),
      assigned_to: reward.assigned_to,
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    setError('')
    try {
      if (editingReward) {
        await updateReward(editingReward.reward_id, form.title.trim(), Number(form.point_cost))
      } else {
        await createReward(form.title.trim(), Number(form.point_cost), parentId, form.assigned_to)
      }
      setShowForm(false)
      setEditingReward(null)
      await loadRewards()
    } catch (e) {
      setError((editingReward ? '編集' : '作成') + 'に失敗しました。' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove(rewardId) {
    setProcessing(rewardId)
    setError('')
    try {
      await updateRewardStatus(rewardId, 'redeemed')
      await loadRewards()
    } catch (e) {
      setError('承認に失敗しました。' + e.message)
    } finally {
      setProcessing(null)
    }
  }

  async function handleReject(rewardId) {
    setProcessing(rewardId)
    setError('')
    try {
      await updateRewardStatus(rewardId, 'active')
      await loadRewards()
    } catch (e) {
      setError('却下に失敗しました。' + e.message)
    } finally {
      setProcessing(null)
    }
  }

  async function handleDelete(rewardId) {
    if (!confirm('このご褒美を削除しますか？')) return
    setError('')
    try {
      await archiveReward(rewardId)
      await loadRewards()
    } catch (e) {
      setError('削除に失敗しました。' + e.message)
    }
  }

  function getChildName(userId) {
    return children.find(c => c.user_id === userId)?.name || userId
  }

  const pendingRewards = rewards.filter(r => r.status === 'pending')
  const activeRewards = rewards.filter(r => r.status === 'active')
  const redeemedRewards = rewards.filter(r => r.status === 'redeemed')

  return (
    <div style={styles.container}>
      {error && <div style={styles.error}>{error}</div>}

      <button style={styles.addBtn} onClick={openForm} disabled={children.length === 0}>
        🎁 ご褒美を追加
      </button>

      {children.length === 0 && (
        <div style={styles.empty}>
          子どものアカウントが登録されていません。<br />
          子どもがログインしてから設定してください。
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>よみこみちゅう…</div>
      ) : (
        <>
          {/* 申請待ち */}
          {pendingRewards.length > 0 && (
            <>
              <div style={styles.sectionTitle}>⏳ 申請待ち（{pendingRewards.length}件）</div>
              <div style={styles.list}>
                {pendingRewards.map(r => (
                  <div key={r.reward_id} style={styles.card('pending')}>
                    <div style={styles.cardTop}>
                      <div style={styles.cardInfo}>
                        <div style={styles.cardTitle}>🎁 {r.title}</div>
                        <div style={styles.cardMeta}>
                          <span style={styles.cost}>⭐ {r.point_cost} pt</span>
                          <span>{getChildName(r.assigned_to)}</span>
                          <span style={styles.statusBadge('pending')}>申請中</span>
                        </div>
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <button
                        style={styles.approveBtn}
                        disabled={processing === r.reward_id}
                        onClick={() => handleApprove(r.reward_id)}
                      >
                        ✓ 承認
                      </button>
                      <button
                        style={styles.rejectBtn}
                        disabled={processing === r.reward_id}
                        onClick={() => handleReject(r.reward_id)}
                      >
                        却下
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 公開中 */}
          {activeRewards.length > 0 && (
            <>
              <div style={styles.sectionTitle}>🎀 公開中のご褒美</div>
              <div style={styles.list}>
                {activeRewards.map(r => (
                  <div key={r.reward_id} style={styles.card('active')}>
                    <div style={styles.cardTop}>
                      <div style={styles.cardInfo}>
                        <div style={styles.cardTitle}>🎁 {r.title}</div>
                        <div style={styles.cardMeta}>
                          <span style={styles.cost}>⭐ {r.point_cost} pt</span>
                          <span>{getChildName(r.assigned_to)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button style={styles.editBtn} onClick={() => openEditForm(r)}>
                          ✏️ 編集
                        </button>
                        <button style={styles.deleteBtn} onClick={() => handleDelete(r.reward_id)}>
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 交換済み */}
          {redeemedRewards.length > 0 && (
            <>
              <div style={styles.sectionTitle}>✅ 交換済み</div>
              <div style={styles.list}>
                {redeemedRewards.map(r => (
                  <div key={r.reward_id} style={{ ...styles.card('redeemed'), opacity: 0.6 }}>
                    <div style={styles.cardTop}>
                      <div style={styles.cardInfo}>
                        <div style={styles.cardTitle}>🎁 {r.title}</div>
                        <div style={styles.cardMeta}>
                          <span style={styles.cost}>⭐ {r.point_cost} pt</span>
                          <span>{getChildName(r.assigned_to)}</span>
                          <span style={styles.statusBadge('redeemed')}>交換済み ✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {rewards.length === 0 && (
            <div style={styles.empty}>
              ご褒美がまだありません。<br />
              「ご褒美を追加」で作成しましょう。
            </div>
          )}
        </>
      )}

      {/* 作成フォーム */}
      {showForm && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>{editingReward ? '🎁 ご褒美を編集' : '🎁 ご褒美を追加'}</div>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>ご褒美の名前</label>
                <input
                  style={styles.input}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例: ゲームを1時間する"
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>必要ポイント</label>
                  <select
                    style={styles.select}
                    value={form.point_cost}
                    onChange={e => setForm(f => ({ ...f, point_cost: e.target.value }))}
                  >
                    {POINT_OPTIONS.map(p => (
                      <option key={p} value={p}>⭐ {p} pt</option>
                    ))}
                  </select>
                </div>

                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>対象の子ども</label>
                  <select
                    style={{ ...styles.select, opacity: editingReward ? 0.6 : 1 }}
                    value={form.assigned_to}
                    onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                    disabled={!!editingReward}
                    required
                  >
                    {children.map(c => (
                      <option key={c.user_id} value={c.user_id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" style={styles.submitBtn} disabled={submitting}>
                {submitting ? '保存中…' : editingReward ? '保存する' : '追加する'}
              </button>
              <button type="button" style={styles.cancelBtn} onClick={() => { setShowForm(false); setEditingReward(null) }}>
                キャンセル
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
