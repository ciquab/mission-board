import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getTasks,
  createTask,
  updateTask,
  archiveTask,
  updateTaskApproval,
  getChildren,
  getRewardRequests,
  addParentToChild,
  getUserPoints,
  getTaskLogsWithDetails,
} from '../api/sheets'
import { useNotifications } from '../hooks/useNotifications'
import TaskForm from '../components/parent/TaskForm'
import TaskCard from '../components/parent/TaskCard'
import ProposalCard from '../components/parent/ProposalCard'
import ChildProgressCard from '../components/parent/ChildProgressCard'
import RewardManager from '../components/parent/RewardManager'
import NotificationScheduleModal from '../components/NotificationScheduleModal'

const TAB_DASHBOARD = 'dashboard'
const TAB_TASKS = 'tasks'
const TAB_PROPOSALS = 'proposals'
const TAB_REWARDS = 'rewards'
const TAB_HISTORY = 'history'

const styles = {
  container: {
    maxWidth: '680px',
    margin: '0 auto',
    minHeight: '100vh',
    background: '#F5F7FA',
  },
  header: {
    background: '#2E75B6',
    color: '#fff',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.5)',
    flexShrink: 0,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: '0.95rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  roleBadge: {
    fontSize: '0.72rem',
    background: 'rgba(255,255,255,0.25)',
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  switchBtn: {
    padding: '0.4rem 0.75rem',
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '6px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minHeight: 'auto',
  },
  signOutBtn: {
    padding: '0.4rem 0.75rem',
    background: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '6px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    minHeight: 'auto',
  },
  tabs: {
    display: 'flex',
    background: '#fff',
    borderBottom: '2px solid #eee',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  },
  tab: (active) => ({
    flexShrink: 0,
    padding: '0.85rem 0.9rem',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #2E75B6' : '2px solid transparent',
    marginBottom: '-2px',
    color: active ? '#2E75B6' : '#888',
    fontWeight: active ? 'bold' : 'normal',
    fontSize: '0.88rem',
    cursor: 'pointer',
    minHeight: 'auto',
    whiteSpace: 'nowrap',
  }),
  tabBadge: {
    display: 'inline-block',
    background: '#F44336',
    color: '#fff',
    borderRadius: '999px',
    fontSize: '0.7rem',
    padding: '0.05rem 0.45rem',
    marginLeft: '0.35rem',
    fontWeight: 'bold',
    verticalAlign: 'middle',
  },
  body: {
    padding: '1rem',
  },
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
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    padding: '3rem 1rem',
    fontSize: '0.9rem',
    lineHeight: 1.7,
  },
  error: {
    background: '#FEEBEE',
    color: '#C62828',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  loading: {
    textAlign: 'center',
    color: '#aaa',
    padding: '3rem 1rem',
  },
  // ダッシュボード用スタイル
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  summaryCard: (color) => ({
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderTop: `3px solid ${color}`,
  }),
  summaryNum: (color) => ({
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color,
    lineHeight: 1,
    marginBottom: '0.3rem',
  }),
  summaryLabel: {
    fontSize: '0.75rem',
    color: '#888',
  },
  dashSection: {
    marginBottom: '1.25rem',
  },
  dashSectionTitle: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
  childList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  noChildMsg: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    textAlign: 'center',
    color: '#aaa',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  // 履歴タブ用スタイル
  historySelector: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  historySelectorBtn: (active) => ({
    padding: '0.45rem 0.85rem',
    borderRadius: '999px',
    border: active ? 'none' : '1px solid #ddd',
    background: active ? '#2E75B6' : '#fff',
    color: active ? '#fff' : '#666',
    fontSize: '0.85rem',
    fontWeight: active ? 'bold' : 'normal',
    cursor: 'pointer',
    minHeight: 'auto',
  }),
  historyCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '0.9rem 1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.6rem',
  },
  historyIcon: {
    fontSize: '1.4rem',
    flexShrink: 0,
  },
  historyBody: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.2rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  historyDate: {
    fontSize: '0.75rem',
    color: '#aaa',
  },
  historyPoints: (pts) => ({
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: pts >= 0 ? '#4CAF50' : '#F44336',
    flexShrink: 0,
    minWidth: '2.5rem',
    textAlign: 'right',
  }),
  pointsBadge: {
    background: 'linear-gradient(135deg, #FFD700, #FFA000)',
    color: '#5D4037',
    borderRadius: '999px',
    padding: '0.2rem 0.6rem',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
  },
}

export default function ParentApp() {
  const { user, signOut } = useAuth()
  const { supported: notifSupported, permission, enabled: notifEnabled, loading: notifLoading, enable: enableNotif, disable: disableNotif } = useNotifications(user.id)
  const [tab, setTab] = useState(TAB_DASHBOARD)
  const [tasks, setTasks] = useState([])
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [rewardRequests, setRewardRequests] = useState([])
  const [showNotifInfo, setShowNotifInfo] = useState(false)
  const [showLinkChild, setShowLinkChild] = useState(false)
  const [linkEmail, setLinkEmail] = useState('')
  const [linkStatus, setLinkStatus] = useState('') // 'success' | 'error' | ''
  const [linkMessage, setLinkMessage] = useState('')
  const [linking, setLinking] = useState(false)
  // 履歴タブ用
  const [childPoints, setChildPoints] = useState({}) // { [childId]: number }
  const [childLogs, setChildLogs] = useState({})     // { [childId]: log[] }
  const [historyChildId, setHistoryChildId] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [allTasks, childList, rewardReqs] = await Promise.all([
        getTasks(),
        getChildren(user.id),
        getRewardRequests(user.id),
      ])
      setTasks(allTasks.filter(t => t.status === 'active'))
      setChildren(childList)
      setRewardRequests(rewardReqs)

      // 各子どものポイントをまとめて取得
      if (childList.length > 0) {
        const pointsArr = await Promise.all(childList.map(c => getUserPoints(c.user_id)))
        const pts = {}
        childList.forEach((c, i) => { pts[c.user_id] = pointsArr[i] })
        setChildPoints(pts)
      }
    } catch (e) {
      setError('データの読み込みに失敗しました。' + e.message)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  const activeTasks = tasks.filter(t => t.approval_status !== 'pending')
  // 自分の子どもからの提案のみ表示
  const childIds = children.map(c => c.user_id)
  const proposals = tasks.filter(t =>
    t.approval_status === 'pending' && childIds.includes(t.created_by)
  )

  function getAssigneeName(task) {
    const child = children.find(c => c.user_id === task.assigned_to)
    return child?.name || task.assigned_to || '未割り当て'
  }

  // 子どもごとの統計を取得
  function getChildStats(childId) {
    const taskCount = activeTasks.filter(t => t.assigned_to === childId).length
    const proposalCount = proposals.filter(t => t.created_by === childId).length
    return { taskCount, proposalCount }
  }

  async function handleCreateTask(form) {
    setSubmitting(true)
    setError('')
    try {
      await createTask({
        ...form,
        require_approval: String(form.require_approval),
        created_by: user.id,
        created_by_role: 'parent',
        approval_status: '-',
        due_date: '',
      })
      setShowForm(false)
      await loadData()
    } catch (e) {
      setError('タスクの作成に失敗しました。' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditTask(form) {
    setSubmitting(true)
    setError('')
    try {
      await updateTask(editingTask.task_id, {
        ...form,
        require_approval: String(form.require_approval),
      })
      setEditingTask(null)
      await loadData()
    } catch (e) {
      setError('タスクの更新に失敗しました。' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteTask(taskId) {
    if (!confirm('このタスクを削除しますか？')) return
    setError('')
    try {
      await archiveTask(taskId)
      await loadData()
    } catch (e) {
      setError('タスクの削除に失敗しました。' + e.message)
    }
  }

  // 子どもを選択して完了ログを読み込む
  async function handleSelectHistoryChild(childId) {
    setHistoryChildId(childId)
    if (childLogs[childId]) return // キャッシュ済みならスキップ
    setHistoryLoading(true)
    try {
      const logs = await getTaskLogsWithDetails(childId)
      setChildLogs(prev => ({ ...prev, [childId]: logs }))
    } catch (e) {
      setError('履歴の読み込みに失敗しました。' + e.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function handleApprove(taskId, pointValue) {
    setError('')
    try {
      await updateTaskApproval(taskId, 'approved', Number(pointValue))
      await loadData()
    } catch (e) {
      setError('承認に失敗しました。' + e.message)
    }
  }

  async function handleReject(taskId) {
    if (!confirm('この提案を却下しますか？')) return
    setError('')
    try {
      await updateTaskApproval(taskId, 'rejected', 0)
      await loadData()
    } catch (e) {
      setError('却下に失敗しました。' + e.message)
    }
  }

  async function handleLinkChild(e) {
    e.preventDefault()
    if (!linkEmail.trim()) return
    setLinking(true)
    setLinkStatus('')
    setLinkMessage('')
    try {
      await addParentToChild(linkEmail.trim(), user.id)
      setLinkStatus('success')
      setLinkMessage('リンクしました！ダッシュボードに子どもが表示されます。')
      setLinkEmail('')
      await loadData()
    } catch (err) {
      setLinkStatus('error')
      setLinkMessage(err.message)
    } finally {
      setLinking(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          {user.picture && (
            <img src={user.picture} alt="" style={styles.avatar} />
          )}
          <div>
            <div style={styles.userName}>{user.name}</div>
            <div style={styles.roleBadge}>おやモード</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          {/* 通知トグルボタン（denied の場合は非表示） */}
          {notifSupported && permission !== 'denied' && (
            <>
              <button
                style={styles.switchBtn}
                onClick={notifEnabled ? disableNotif : enableNotif}
                disabled={notifLoading}
                title={notifEnabled ? '通知をオフにする' : '通知をオンにする'}
              >
                {notifLoading ? '…' : notifEnabled ? '🔔' : '🔕'}
              </button>
              <button
                style={{ ...styles.switchBtn, padding: '0.4rem 0.6rem' }}
                onClick={() => setShowNotifInfo(true)}
                title="通知スケジュールを確認"
              >
                ℹ️
              </button>
            </>
          )}
          <button style={styles.signOutBtn} onClick={signOut}>
            ログアウト
          </button>
        </div>
      </header>

      {/* タブ */}
      <div style={styles.tabs} className="parent-tabs">
        <button className="tab-item" style={styles.tab(tab === TAB_DASHBOARD)} onClick={() => setTab(TAB_DASHBOARD)}>
          ダッシュボード
        </button>
        <button className="tab-item" style={styles.tab(tab === TAB_TASKS)} onClick={() => setTab(TAB_TASKS)}>
          タスク管理
        </button>
        <button className="tab-item" style={styles.tab(tab === TAB_PROPOSALS)} onClick={() => setTab(TAB_PROPOSALS)}>
          承認待ち
          {proposals.length > 0 && (
            <span style={styles.tabBadge}>{proposals.length}</span>
          )}
        </button>
        <button className="tab-item" style={styles.tab(tab === TAB_REWARDS)} onClick={() => setTab(TAB_REWARDS)}>
          ご褒美
          {rewardRequests.length > 0 && (
            <span style={styles.tabBadge}>{rewardRequests.length}</span>
          )}
        </button>
        <button
          className="tab-item"
          style={styles.tab(tab === TAB_HISTORY)}
          onClick={() => {
            setTab(TAB_HISTORY)
            // 子どもが1人以上いれば最初を自動選択
            if (children.length > 0 && !historyChildId) {
              handleSelectHistoryChild(children[0].user_id)
            }
          }}
        >
          履歴
        </button>
      </div>

      {/* ボディ */}
      <div style={styles.body}>
        {error && <div style={styles.error}>{error}</div>}

        {/* ---- ダッシュボード ---- */}
        {tab === TAB_DASHBOARD && (
          <>
            {loading ? (
              <div style={styles.loading}>よみこみちゅう…</div>
            ) : (
              <>
                {/* サマリー統計 */}
                <div style={styles.summaryRow} className="summary-row">
                  <div style={styles.summaryCard('#2E75B6')}>
                    <div style={styles.summaryNum('#2E75B6')}>{children.length}</div>
                    <div style={styles.summaryLabel}>こども</div>
                  </div>
                  <div style={styles.summaryCard('#4CAF50')}>
                    <div style={styles.summaryNum('#4CAF50')}>{activeTasks.length}</div>
                    <div style={styles.summaryLabel}>アクティブタスク</div>
                  </div>
                  <div style={styles.summaryCard(proposals.length > 0 ? '#F44336' : '#9E9E9E')}>
                    <div style={styles.summaryNum(proposals.length > 0 ? '#F44336' : '#9E9E9E')}>
                      {proposals.length}
                    </div>
                    <div style={styles.summaryLabel}>承認待ち</div>
                  </div>
                </div>

                {/* 子どもの一覧 */}
                <div style={styles.dashSection}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={styles.dashSectionTitle}>子どもの状況</div>
                    <button
                      style={{ padding: '0.35rem 0.75rem', background: '#fff', color: '#2E75B6', border: '1px solid #2E75B6', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', minHeight: 'auto' }}
                      onClick={() => { setShowLinkChild(true); setLinkStatus(''); setLinkMessage('') }}
                    >
                      ＋ 子どもをリンク
                    </button>
                  </div>
                  {children.length === 0 ? (
                    <div style={styles.noChildMsg}>
                      子どものアカウントがまだ登録されていません。<br />
                      子どもに「こどもモード」でログインしてもらい、<br />
                      親のメールアドレスを入力してもらいましょう。
                    </div>
                  ) : (
                    <div style={styles.childList}>
                      {children.map(child => {
                        const { taskCount, proposalCount } = getChildStats(child.user_id)
                        return (
                          <ChildProgressCard
                            key={child.user_id}
                            child={child}
                            taskCount={taskCount}
                            proposalCount={proposalCount}
                            points={childPoints[child.user_id]}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 承認待ちがあれば誘導 */}
                {proposals.length > 0 && (
                  <div style={styles.dashSection}>
                    <div style={styles.dashSectionTitle}>アクション必要</div>
                    <button
                      style={{
                        ...styles.addBtn,
                        background: '#F44336',
                      }}
                      onClick={() => setTab(TAB_PROPOSALS)}
                    >
                      💡 承認待ちの提案を確認する（{proposals.length}件）
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ---- タスク管理 ---- */}
        {tab === TAB_TASKS && (
          <>
            <button style={styles.addBtn} onClick={() => setShowForm(true)}>
              ＋ 新しいタスクを作成
            </button>

            {loading ? (
              <div style={styles.loading}>よみこみちゅう…</div>
            ) : activeTasks.length === 0 ? (
              <div style={styles.empty}>
                タスクがまだありません。<br />
                「新しいタスクを作成」で追加しましょう。
              </div>
            ) : (
              <div style={styles.taskList}>
                {activeTasks.map(task => (
                  <TaskCard
                    key={task.task_id}
                    task={task}
                    assigneeName={getAssigneeName(task)}
                    onEdit={setEditingTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- 承認待ち ---- */}
        {tab === TAB_PROPOSALS && (
          <>
            {loading ? (
              <div style={styles.loading}>よみこみちゅう…</div>
            ) : proposals.length === 0 ? (
              <div style={styles.empty}>
                承認待ちの提案はありません。
              </div>
            ) : (
              <div style={styles.taskList}>
                {proposals.map(task => (
                  <ProposalCard
                    key={task.task_id}
                    task={task}
                    proposerName={
                      children.find(c => c.user_id === task.created_by)?.name || task.created_by
                    }
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- ご褒美管理 ---- */}
        {tab === TAB_REWARDS && (
          <RewardManager parentId={user.id} children={children} />
        )}

        {/* ---- 履歴 ---- */}
        {tab === TAB_HISTORY && (
          <>
            {children.length === 0 ? (
              <div style={styles.empty}>
                子どものアカウントが登録されていません。<br />
                ダッシュボードから子どもをリンクしてください。
              </div>
            ) : (
              <>
                {/* 子ども選択 */}
                <div style={styles.historySelector}>
                  {children.map(child => (
                    <button
                      key={child.user_id}
                      style={styles.historySelectorBtn(historyChildId === child.user_id)}
                      onClick={() => handleSelectHistoryChild(child.user_id)}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>

                {/* 選択中の子どものポイント合計 */}
                {historyChildId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', padding: '0.85rem 1rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '1.3rem' }}>🏆</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.2rem' }}>現在の保有ポイント</div>
                      <span style={styles.pointsBadge}>
                        ⭐ {childPoints[historyChildId] ?? '…'} pt
                      </span>
                    </div>
                  </div>
                )}

                {/* 完了ログ一覧 */}
                {historyLoading ? (
                  <div style={styles.loading}>よみこみちゅう…</div>
                ) : historyChildId && (childLogs[historyChildId] || []).length === 0 ? (
                  <div style={styles.empty}>完了したタスクはまだありません。</div>
                ) : historyChildId ? (
                  (childLogs[historyChildId] || []).map(log => (
                    <div key={log.log_id} style={styles.historyCard}>
                      <span style={styles.historyIcon}>✅</span>
                      <div style={styles.historyBody}>
                        <div style={styles.historyTitle}>{log.title}</div>
                        <div style={styles.historyDate}>
                          {log.completed_at
                            ? new Date(log.completed_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '日時不明'}
                        </div>
                      </div>
                      <div style={styles.historyPoints(log.points_earned)}>
                        {log.points_earned >= 0 ? '+' : ''}{log.points_earned} pt
                      </div>
                    </div>
                  ))
                ) : null}
              </>
            )}
          </>
        )}
      </div>

      {/* タスク作成フォーム */}
      {showForm && (
        <TaskForm
          children={children}
          onSubmit={handleCreateTask}
          onClose={() => setShowForm(false)}
          submitting={submitting}
        />
      )}

      {/* タスク編集フォーム */}
      {editingTask && (
        <TaskForm
          initialData={editingTask}
          children={children}
          onSubmit={handleEditTask}
          onClose={() => setEditingTask(null)}
          submitting={submitting}
        />
      )}

      {/* 通知スケジュールモーダル */}
      {showNotifInfo && (
        <NotificationScheduleModal onClose={() => setShowNotifInfo(false)} />
      )}

      {/* 子どもリンクモーダル */}
      {showLinkChild && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowLinkChild(false)}
        >
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#333' }}>👶 子どもをリンク</div>
              <button onClick={() => setShowLinkChild(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#999', minHeight: 'auto' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem', lineHeight: 1.6 }}>
              子どものGoogleアカウントのメールアドレスを入力してください。子どもが先にログイン済みである必要があります。
            </p>
            <form onSubmit={handleLinkChild}>
              <input
                type="email"
                value={linkEmail}
                onChange={e => { setLinkEmail(e.target.value); setLinkStatus('') }}
                placeholder="child@example.com"
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', marginBottom: '0.75rem' }}
              />
              {linkMessage && (
                <div style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '0.75rem', background: linkStatus === 'success' ? '#E8F5E9' : '#FEEBEE', color: linkStatus === 'success' ? '#2E7D32' : '#C62828' }}>
                  {linkStatus === 'success' ? '✅ ' : '❌ '}{linkMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={linking}
                style={{ width: '100%', padding: '0.85rem', background: '#2E75B6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                {linking ? 'リンク中…' : 'リンクする'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
