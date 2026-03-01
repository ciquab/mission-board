import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getTasks,
  createTask,
  updateTask,
  archiveTask,
  updateTaskApproval,
  getChildren,
} from '../api/sheets'
import TaskForm from '../components/parent/TaskForm'
import TaskCard from '../components/parent/TaskCard'
import ProposalCard from '../components/parent/ProposalCard'

const TAB_TASKS = 'tasks'
const TAB_PROPOSALS = 'proposals'

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
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.5)',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: '0.95rem',
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
  },
  tab: (active) => ({
    flex: 1,
    padding: '0.85rem',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #2E75B6' : '2px solid transparent',
    marginBottom: '-2px',
    color: active ? '#2E75B6' : '#888',
    fontWeight: active ? 'bold' : 'normal',
    fontSize: '0.9rem',
    cursor: 'pointer',
    minHeight: 'auto',
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
}

export default function ParentApp() {
  const { user, signOut, switchRole } = useAuth()
  const [tab, setTab] = useState(TAB_TASKS)
  const [tasks, setTasks] = useState([])
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [allTasks, childList] = await Promise.all([
        getTasks(),
        getChildren(user.id),
      ])
      setTasks(allTasks.filter(t => t.status === 'active'))
      setChildren(childList)
    } catch (e) {
      setError('データの読み込みに失敗しました。' + e.message)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  const activeTasks = tasks.filter(t => t.approval_status !== 'pending')
  const proposals = tasks.filter(t => t.approval_status === 'pending')

  function getAssigneeName(task) {
    const child = children.find(c => c.user_id === task.assigned_to)
    return child?.name || task.assigned_to || '未割り当て'
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
          <button style={styles.switchBtn} onClick={() => switchRole('child')}>
            子どもモードへ
          </button>
          <button style={styles.signOutBtn} onClick={signOut}>
            ログアウト
          </button>
        </div>
      </header>

      {/* タブ */}
      <div style={styles.tabs}>
        <button style={styles.tab(tab === TAB_TASKS)} onClick={() => setTab(TAB_TASKS)}>
          タスク管理
        </button>
        <button style={styles.tab(tab === TAB_PROPOSALS)} onClick={() => setTab(TAB_PROPOSALS)}>
          承認待ち
          {proposals.length > 0 && (
            <span style={styles.tabBadge}>{proposals.length}</span>
          )}
        </button>
      </div>

      {/* ボディ */}
      <div style={styles.body}>
        {error && <div style={styles.error}>{error}</div>}

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
    </div>
  )
}
