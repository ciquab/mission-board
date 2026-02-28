import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getTasksForUser,
  createTask,
  logTaskCompletion,
  getUserPoints,
} from '../api/sheets'
import MissionCard from '../components/child/MissionCard'
import ProposalForm from '../components/child/ProposalForm'

const TIME_BLOCKS = [
  { value: 'morning', label: '🌅 あさ' },
  { value: 'afternoon', label: '☀️ ひる' },
  { value: 'evening', label: '🌇 ゆうがた' },
  { value: 'night', label: '🌙 よる' },
  { value: 'bedtime', label: '🛏 ねるまえ' },
]

// 現在の時間帯を自動判定
function getCurrentTimeBlock() {
  const h = new Date().getHours()
  if (h < 10) return 'morning'
  if (h < 14) return 'afternoon'
  if (h < 18) return 'evening'
  if (h < 22) return 'night'
  return 'bedtime'
}

// 今日の日付文字列を取得（日をまたいでも正しく動作させるため関数化）
function getToday() {
  return new Date().toDateString()
}

const styles = {
  container: {
    maxWidth: '480px',
    margin: '0 auto',
    minHeight: '100vh',
    background: '#F5F7FA',
    paddingBottom: '5rem',
  },
  header: {
    background: 'linear-gradient(135deg, #2E75B6 0%, #1a4f8a 100%)',
    color: '#fff',
    padding: '1.25rem 1.25rem 1rem',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
  },
  greeting: {
    fontSize: '1rem',
    opacity: 0.85,
    marginBottom: '0.15rem',
  },
  userName: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.35rem',
  },
  pointDisplay: {
    background: '#FFB300',
    color: '#fff',
    borderRadius: '999px',
    padding: '0.3rem 0.8rem',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  switchBtn: {
    padding: '0.3rem 0.65rem',
    background: 'rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '6px',
    fontSize: '0.72rem',
    cursor: 'pointer',
    minHeight: 'auto',
  },
  timeBlockTabs: {
    display: 'flex',
    gap: '0',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    padding: '0 0.25rem',
  },
  timeTab: (active) => ({
    padding: '0.5rem 0.85rem',
    background: 'none',
    border: 'none',
    borderBottom: active ? '3px solid #fff' : '3px solid transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
    fontWeight: active ? 'bold' : 'normal',
    fontSize: '0.85rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minHeight: 'auto',
    flexShrink: 0,
  }),
  body: {
    padding: '1rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  missionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: '#aaa',
    fontSize: '0.9rem',
    lineHeight: 1.7,
  },
  allDone: {
    textAlign: 'center',
    padding: '2.5rem 1rem',
    color: '#4CAF50',
    fontSize: '1rem',
    fontWeight: 'bold',
    lineHeight: 1.7,
  },
  loading: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: '#aaa',
    fontSize: '0.9rem',
  },
  error: {
    background: '#FEEBEE',
    color: '#C62828',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  proposalSection: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '2px dashed #ddd',
  },
  pendingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  pendingItem: {
    background: '#FFF8E1',
    borderRadius: '8px',
    padding: '0.6rem 0.75rem',
    fontSize: '0.85rem',
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  proposeBtn: {
    position: 'fixed',
    bottom: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.9rem 2rem',
    background: '#FFB300',
    color: '#fff',
    border: 'none',
    borderRadius: '999px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(255,179,0,0.4)',
    whiteSpace: 'nowrap',
    zIndex: 100,
  },
  signOutLink: {
    textAlign: 'center',
    marginTop: '2rem',
    color: '#aaa',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}

// 1日の提案上限
const PROPOSAL_LIMIT = 5

export default function ChildApp() {
  const { user, signOut, switchRole } = useAuth()
  const [activeTimeBlock, setActiveTimeBlock] = useState(getCurrentTimeBlock())
  const [tasks, setTasks] = useState([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(null)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [submittingProposal, setSubmittingProposal] = useState(false)

  // ローカルで完了済みを管理（Sheetsへの追記後にキャッシュ）
  // マウント時の今日の日付でキーを決定する
  const [completedIds, setCompletedIds] = useState(() => {
    const key = `completed_${getToday()}`
    try {
      return JSON.parse(localStorage.getItem(key) || '[]')
    } catch { return [] }
  })

  // 本日の提案数（ローカルキャッシュ）
  const [todayProposals, setTodayProposals] = useState(() => {
    const key = `proposals_${getToday()}_${user.id}`
    return Number(localStorage.getItem(key) || 0)
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [myTasks, myPoints] = await Promise.all([
        getTasksForUser(user.id),
        getUserPoints(user.id),
      ])
      setTasks(myTasks)
      setPoints(myPoints)
    } catch (e) {
      setError('データのよみこみに失敗しました。' + e.message)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  // 現在の時間帯のタスク（承認済みのみ）
  const currentMissions = tasks.filter(t =>
    t.time_block === activeTimeBlock && t.approval_status !== 'pending'
  )

  // 承認待ちの提案
  const pendingProposals = tasks.filter(t => t.approval_status === 'pending')

  async function handleComplete(taskId, pointValue) {
    setCompleting(taskId)
    setError('')
    try {
      await logTaskCompletion(taskId, user.id, Number(pointValue || 0))

      const newCompleted = [...completedIds, taskId]
      setCompletedIds(newCompleted)
      localStorage.setItem(`completed_${getToday()}`, JSON.stringify(newCompleted))
      setPoints(prev => prev + Number(pointValue || 0))
    } catch (e) {
      setError('かんりょうの記録に失敗しました。' + e.message)
    } finally {
      setCompleting(null)
    }
  }

  async function handlePropose(form) {
    if (todayProposals >= PROPOSAL_LIMIT) {
      setError(`きょうのていあんはもう${PROPOSAL_LIMIT}こだよ。あしたまたてたね！`)
      return
    }
    setSubmittingProposal(true)
    setError('')
    try {
      await createTask({
        ...form,
        type: 'routine',
        recurrence: 'daily',
        assigned_to: user.id,
        created_by: user.id,
        created_by_role: 'child',
        approval_status: 'pending',
        require_approval: 'true',
        due_date: '',
        point_value: '0', // 親が承認時に設定
      })

      const key = `proposals_${getToday()}_${user.id}`
      const newCount = todayProposals + 1
      setTodayProposals(newCount)
      localStorage.setItem(key, String(newCount))

      setShowProposalForm(false)
      await loadData()
    } catch (e) {
      setError('ていあんのおくりに失敗しました。' + e.message)
    } finally {
      setSubmittingProposal(false)
    }
  }

  const allDone = currentMissions.length > 0 &&
    currentMissions.every(m => completedIds.includes(m.task_id))

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.greeting}>やあ、</div>
            <div style={styles.userName}>{user.name} ！</div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.pointDisplay}>
              ⭐ {points} pt
            </div>
            {user.role === 'child' && (
              <button style={styles.switchBtn} onClick={() => switchRole('parent')}>
                おやモードへ
              </button>
            )}
          </div>
        </div>

        {/* 時間帯タブ */}
        <div style={styles.timeBlockTabs}>
          {TIME_BLOCKS.map(tb => (
            <button
              key={tb.value}
              style={styles.timeTab(activeTimeBlock === tb.value)}
              onClick={() => setActiveTimeBlock(tb.value)}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </header>

      {/* ボディ */}
      <div style={styles.body}>
        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.loading}>よみこみちゅう…</div>
        ) : allDone ? (
          <div style={styles.allDone}>
            🎉 この時間のミッションをぜんぶクリア！<br />
            すごい！やったね！
          </div>
        ) : currentMissions.length === 0 ? (
          <div style={styles.empty}>
            この時間のミッションはないよ。<br />
            ほかの時間を見てみよう！
          </div>
        ) : (
          <>
            <div style={styles.sectionTitle}>
              🎯 ミッション
            </div>
            <div style={styles.missionList}>
              {currentMissions.map(task => (
                <MissionCard
                  key={task.task_id}
                  task={task}
                  completed={completedIds.includes(task.task_id)}
                  onComplete={handleComplete}
                  completing={completing === task.task_id}
                />
              ))}
            </div>
          </>
        )}

        {/* 承認待ちの提案一覧 */}
        {pendingProposals.length > 0 && (
          <div style={styles.proposalSection}>
            <div style={styles.sectionTitle}>
              💡 おやがかくにんちゅう
            </div>
            <div style={styles.pendingList}>
              {pendingProposals.map(task => (
                <div key={task.task_id} style={styles.pendingItem}>
                  <span>{task.icon || '💡'}</span>
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.signOutLink} onClick={signOut}>
          ログアウト
        </div>
      </div>

      {/* ていあんするボタン */}
      <button
        style={{
          ...styles.proposeBtn,
          opacity: todayProposals >= PROPOSAL_LIMIT ? 0.5 : 1,
        }}
        onClick={() => setShowProposalForm(true)}
        disabled={todayProposals >= PROPOSAL_LIMIT}
      >
        💡 ミッションをていあんする
        {todayProposals > 0 && ` (${todayProposals}/${PROPOSAL_LIMIT})`}
      </button>

      {/* 提案フォーム */}
      {showProposalForm && (
        <ProposalForm
          onSubmit={handlePropose}
          onClose={() => setShowProposalForm(false)}
          submitting={submittingProposal}
        />
      )}
    </div>
  )
}
