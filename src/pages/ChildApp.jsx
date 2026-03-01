import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getTasksForUser,
  createTask,
  logTaskCompletion,
  getUserPoints,
  getStreak,
  getBadges,
  checkAndAwardBadges,
  getRewards,
} from '../api/sheets'
import { useNotifications } from '../hooks/useNotifications'
import MissionCard from '../components/child/MissionCard'
import ProposalForm from '../components/child/ProposalForm'
import BadgePanel from '../components/child/BadgePanel'
import RewardShop from '../components/child/RewardShop'
import NotificationScheduleModal from '../components/NotificationScheduleModal'
import { fireAllDoneConfetti } from '../utils/confetti'
import { getBadgeDef } from '../utils/badges'

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

// 今日このタスクを表示すべきかを recurrence 文字列で判定
function isTaskScheduledToday(recurrence) {
  if (!recurrence || recurrence === 'daily' || recurrence === 'weekly') return true
  if (recurrence.startsWith('weekly:')) {
    const days = recurrence.split(':')[1].split(',').map(Number)
    return days.includes(new Date().getDay())
  }
  if (recurrence.startsWith('monthly:')) {
    return new Date().getDate() === Number(recurrence.split(':')[1])
  }
  return true
}

// 1日の提案上限
const PROPOSAL_LIMIT = 5

// タブ定義
const TAB_MISSION = 'mission'
const TAB_MYPAGE = 'mypage'

const styles = {
  container: {
    maxWidth: '480px',
    margin: '0 auto',
    minHeight: '100vh',
    background: '#EEF2FF',
    paddingBottom: '6.5rem',
  },
  header: {
    background: 'linear-gradient(160deg, #1565C0 0%, #1976D2 60%, #42A5F5 100%)',
    color: '#fff',
    padding: '1.25rem 1.25rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 2px 12px rgba(21,101,192,0.3)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.85rem',
  },
  greeting: {
    fontSize: '1rem',
    opacity: 0.85,
    marginBottom: '0.1rem',
  },
  userName: {
    fontSize: '1.7rem',
    fontWeight: 'bold',
    letterSpacing: '-0.5px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.4rem',
  },
  headerStats: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  pointDisplay: {
    background: '#FFB300',
    color: '#fff',
    borderRadius: '999px',
    padding: '0.35rem 0.9rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    boxShadow: '0 2px 8px rgba(255,179,0,0.4)',
  },
  streakDisplay: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    borderRadius: '999px',
    padding: '0.35rem 0.75rem',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
  },
  switchBtn: {
    padding: '0.25rem 0.6rem',
    background: 'rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '6px',
    fontSize: '0.7rem',
    cursor: 'pointer',
    minHeight: 'unset',
    minWidth: 'unset',
  },
  progressSection: {
    marginBottom: '0.85rem',
    padding: '0 0.15rem',
  },
  progressLabel: {
    fontSize: '0.82rem',
    opacity: 0.9,
    marginBottom: '0.4rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCount: {
    fontWeight: 'bold',
    fontSize: '0.88rem',
  },
  progressBg: {
    height: '7px',
    background: 'rgba(255,255,255,0.25)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    height: '100%',
    background: pct >= 100 ? '#FFD600' : '#fff',
    borderRadius: '999px',
    width: `${pct}%`,
    transition: 'width 0.6s ease',
    boxShadow: pct >= 100 ? '0 0 8px rgba(255,214,0,0.8)' : 'none',
  }),
  // ページタブ
  pageTabs: {
    display: 'flex',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    marginTop: '0.5rem',
  },
  pageTab: (active) => ({
    flex: 1,
    padding: '0.65rem 0.5rem',
    background: 'none',
    border: 'none',
    borderBottom: active ? '3px solid #FFD600' : '3px solid transparent',
    color: active ? '#FFD600' : 'rgba(255,255,255,0.65)',
    fontWeight: active ? 'bold' : 'normal',
    fontSize: '0.88rem',
    cursor: 'pointer',
    minHeight: 'unset',
    transition: 'color 0.2s',
  }),
  // 時間帯タブ（ミッションタブ内のみ表示）
  timeBlockTabs: {
    display: 'flex',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    padding: '0 0.1rem',
    gap: '0.1rem',
    borderTop: '1px solid rgba(255,255,255,0.15)',
  },
  timeTab: (active) => ({
    padding: '0.6rem 0.95rem',
    background: 'none',
    border: 'none',
    borderBottom: active ? '3px solid #FFD600' : '3px solid transparent',
    color: active ? '#FFD600' : 'rgba(255,255,255,0.6)',
    fontWeight: active ? 'bold' : 'normal',
    fontSize: '0.9rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minHeight: 'unset',
    flexShrink: 0,
    transition: 'color 0.2s',
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
    gap: '0.85rem',
  },
  empty: {
    textAlign: 'center',
    padding: '3.5rem 1rem',
    color: '#aaa',
    fontSize: '1rem',
    lineHeight: 1.9,
  },
  allDone: {
    textAlign: 'center',
    padding: '2.5rem 1rem',
    lineHeight: 1.7,
  },
  allDoneEmoji: {
    fontSize: '4.5rem',
    display: 'block',
    marginBottom: '0.5rem',
  },
  allDoneTitle: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: '0.4rem',
  },
  allDoneMsg: {
    fontSize: '1rem',
    color: '#555',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: '#aaa',
    fontSize: '1rem',
  },
  error: {
    background: '#FEEBEE',
    color: '#C62828',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  successToast: {
    background: '#E8F5E9',
    color: '#2E7D32',
    border: '1.5px solid #A5D6A7',
    borderRadius: '10px',
    padding: '0.8rem 1rem',
    fontSize: '0.95rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    lineHeight: 1.5,
  },
  proposalSection: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '2px dashed #C5CAE9',
  },
  pendingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  pendingItem: {
    background: '#FFF8E1',
    border: '1px solid #FFE082',
    borderRadius: '10px',
    padding: '0.65rem 0.9rem',
    fontSize: '0.9rem',
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  signOutLink: {
    textAlign: 'center',
    marginTop: '2.5rem',
    color: '#bbb',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  proposeBtn: {
    position: 'fixed',
    bottom: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    height: '56px',
    padding: '0 2rem',
    background: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '999px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255,143,0,0.5)',
    whiteSpace: 'nowrap',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'opacity 0.2s',
    minHeight: 'unset',
  },
  proposalCount: {
    opacity: 0.8,
    fontSize: '0.8em',
  },
  // バッジ取得モーダル
  badgeModalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeModal: {
    background: '#fff',
    borderRadius: '20px',
    padding: '2rem 1.5rem',
    textAlign: 'center',
    maxWidth: '320px',
    width: '90%',
    boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
    animation: 'none',
  },
  badgeModalEmoji: {
    fontSize: '4rem',
    display: 'block',
    marginBottom: '0.5rem',
  },
  badgeModalTitle: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.3rem',
  },
  badgeModalLabel: {
    fontSize: '1rem',
    color: '#FFB300',
    fontWeight: 'bold',
    marginBottom: '0.4rem',
  },
  badgeModalDesc: {
    fontSize: '0.9rem',
    color: '#777',
    lineHeight: 1.5,
  },
}

export default function ChildApp() {
  const { user, signOut } = useAuth()
  const { supported: notifSupported, permission, enabled: notifEnabled, loading: notifLoading, enable: enableNotif, disable: disableNotif } = useNotifications(user.id)
  const [pageTab, setPageTab] = useState(TAB_MISSION)
  const [activeTimeBlock, setActiveTimeBlock] = useState(getCurrentTimeBlock())
  const [tasks, setTasks] = useState([])
  const [points, setPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [badges, setBadges] = useState([])
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(null)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [submittingProposal, setSubmittingProposal] = useState(false)
  const [proposalSuccess, setProposalSuccess] = useState(false)
  // 新バッジ取得モーダル
  const [newBadges, setNewBadges] = useState([])  // 取得した badge_type 配列
  const [badgeModalIdx, setBadgeModalIdx] = useState(0)
  const [showNotifInfo, setShowNotifInfo] = useState(false)

  // ローカルで完了済みを管理（当日のみ）
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

  // 承認済みタスク全体
  const allTasks = tasks.filter(t =>
    t.approval_status !== 'pending' && isTaskScheduledToday(t.recurrence)
  )
  // 今日の全体進捗
  const completedTodayCount = allTasks.filter(t => completedIds.includes(t.task_id)).length
  const progressPct = allTasks.length > 0
    ? Math.min(100, Math.round(completedTodayCount / allTasks.length * 100))
    : 0
  // 現在の時間帯のミッション
  const currentMissions = tasks.filter(t =>
    t.time_block === activeTimeBlock &&
    t.approval_status !== 'pending' &&
    isTaskScheduledToday(t.recurrence)
  )
  // 承認待ちの提案
  const pendingProposals = tasks.filter(t => t.approval_status === 'pending')
  // 全ミッション完了フラグ
  const allDone = currentMissions.length > 0 &&
    currentMissions.every(m => completedIds.includes(m.task_id))

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [myTasks, myPoints, myStreak, myBadges, myRewards] = await Promise.all([
        getTasksForUser(user.id),
        getUserPoints(user.id),
        getStreak(user.id),
        getBadges(user.id),
        getRewards(user.id),
      ])
      setTasks(myTasks)
      setPoints(myPoints)
      setStreak(myStreak)
      setBadges(myBadges)
      setRewards(myRewards)
    } catch (e) {
      setError('データのよみこみに失敗しました。' + e.message)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  // 紙吹雪を発火済みの時間帯をRefで追跡（当日のみ、localStorageで保存）
  const firedConfettiRef = useRef(null)
  if (firedConfettiRef.current === null) {
    const key = `confetti_${getToday()}`
    try {
      firedConfettiRef.current = new Set(JSON.parse(localStorage.getItem(key) || '[]'))
    } catch {
      firedConfettiRef.current = new Set()
    }
  }

  // 全ミッション完了時に連続紙吹雪（時間帯ごとに初回のみ発火）
  useEffect(() => {
    if (loading) return
    if (allDone && !firedConfettiRef.current.has(activeTimeBlock)) {
      fireAllDoneConfetti()
      firedConfettiRef.current.add(activeTimeBlock)
      localStorage.setItem(`confetti_${getToday()}`, JSON.stringify([...firedConfettiRef.current]))
    }
  }, [allDone, loading, activeTimeBlock])

  async function handleComplete(taskId, pointValue) {
    setCompleting(taskId)
    setError('')
    try {
      const earned = Number(pointValue || 0)
      await logTaskCompletion(taskId, user.id, earned)
      const newCompleted = [...completedIds, taskId]
      setCompletedIds(newCompleted)
      localStorage.setItem(`completed_${getToday()}`, JSON.stringify(newCompleted))
      const newPoints = points + earned
      setPoints(newPoints)

      // タスク完了後にバッジチェック
      const todayAllDone = allTasks.every(t => newCompleted.includes(t.task_id))
      const awarded = await checkAndAwardBadges(user.id, newPoints, streak, todayAllDone)
      if (awarded.length > 0) {
        setNewBadges(awarded)
        setBadgeModalIdx(0)
        // バッジリストを更新
        const updatedBadges = await getBadges(user.id)
        setBadges(updatedBadges)
      }
    } catch (e) {
      setError('かんりょうの記録に失敗しました。' + e.message)
    } finally {
      setCompleting(null)
    }
  }

  async function handlePropose(form) {
    if (todayProposals >= PROPOSAL_LIMIT) {
      setError(`きょうのていあんはもう${PROPOSAL_LIMIT}こだよ。あしたまたしてね！`)
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
        point_value: '0',
      })
      const key = `proposals_${getToday()}_${user.id}`
      const newCount = todayProposals + 1
      setTodayProposals(newCount)
      localStorage.setItem(key, String(newCount))
      setShowProposalForm(false)
      setProposalSuccess(true)
      setTimeout(() => setProposalSuccess(false), 3500)
      await loadData()
    } catch (e) {
      setError('ていあんのおくりに失敗しました。' + e.message)
    } finally {
      setSubmittingProposal(false)
    }
  }

  // バッジモーダルを閉じる（複数バッジの場合は次へ進む）
  function closeBadgeModal() {
    if (badgeModalIdx < newBadges.length - 1) {
      setBadgeModalIdx(i => i + 1)
    } else {
      setNewBadges([])
      setBadgeModalIdx(0)
    }
  }

  // 現在表示中のバッジ
  const currentNewBadge = newBadges[badgeModalIdx]
  const currentBadgeDef = currentNewBadge ? getBadgeDef(currentNewBadge) : null

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', marginRight: '0.5rem' }}>
            <div style={styles.greeting}>やあ、</div>
            <div style={styles.userName}>{user.name}！</div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.headerStats}>
              {streak > 0 && (
                <div style={styles.streakDisplay}>
                  🔥{streak}にち
                </div>
              )}
              <div style={styles.pointDisplay}>
                ⭐ {points} pt
              </div>
            </div>
            {/* 通知トグルボタン（denied の場合は非表示） */}
            {notifSupported && permission !== 'denied' && (
              <>
                <button
                  style={styles.switchBtn}
                  onClick={notifEnabled ? disableNotif : enableNotif}
                  disabled={notifLoading}
                  title={notifEnabled ? 'つうちをオフ' : 'つうちをオン'}
                >
                  {notifLoading ? '…' : notifEnabled ? '🔔' : '🔕'}
                </button>
                <button
                  style={{ ...styles.switchBtn, padding: '0.4rem 0.6rem' }}
                  onClick={() => setShowNotifInfo(true)}
                  title="つうちのじかんをかくにん"
                >
                  ℹ️
                </button>
              </>
            )}
          </div>
        </div>

        {/* 今日の全体進捗バー（ミッションタブのみ） */}
        {!loading && allTasks.length > 0 && pageTab === TAB_MISSION && (
          <div style={styles.progressSection}>
            <div style={styles.progressLabel}>
              <span>きょうのミッション</span>
              <span style={styles.progressCount}>
                {completedTodayCount} / {allTasks.length} クリア
                {progressPct >= 100 && ' 🎊'}
              </span>
            </div>
            <div style={styles.progressBg}>
              <div style={styles.progressFill(progressPct)} />
            </div>
          </div>
        )}

        {/* 時間帯タブ（ミッションタブのみ） */}
        {pageTab === TAB_MISSION && (
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
        )}

        {/* ページタブ */}
        <div style={styles.pageTabs}>
          <button
            style={styles.pageTab(pageTab === TAB_MISSION)}
            onClick={() => setPageTab(TAB_MISSION)}
          >
            🎯 ミッション
          </button>
          <button
            style={styles.pageTab(pageTab === TAB_MYPAGE)}
            onClick={() => setPageTab(TAB_MYPAGE)}
          >
            👤 マイページ
          </button>
        </div>
      </header>

      {/* ボディ */}
      <div style={styles.body}>
        {/* 提案送信成功トースト */}
        {proposalSuccess && (
          <div style={styles.successToast}>
            💡 ていあんをおくったよ！おやがかくにんするまでまってね 🎉
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        {/* ---- ミッションタブ ---- */}
        {pageTab === TAB_MISSION && (
          <>
            {loading ? (
              <div style={styles.loading}>よみこみちゅう…</div>
            ) : allDone ? (
              <div style={styles.allDone}>
                <span style={styles.allDoneEmoji}>🎉</span>
                <div style={styles.allDoneTitle}>ぜんぶクリア！</div>
                <div style={styles.allDoneMsg}>
                  この時間のミッションをぜんぶやったよ！<br />
                  すごい！よくがんばった！
                </div>
              </div>
            ) : currentMissions.length === 0 ? (
              <div style={styles.empty}>
                この時間のミッションはないよ。<br />
                ほかの時間をみてみよう！🔍
              </div>
            ) : (
              <>
                <div style={styles.sectionTitle}>🎯 ミッション</div>
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
            {!loading && pendingProposals.length > 0 && (
              <div style={styles.proposalSection}>
                <div style={styles.sectionTitle}>
                  💡 おやがかくにんちゅう（{pendingProposals.length}件）
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

            <div style={styles.signOutLink} onClick={signOut}>ログアウト</div>
          </>
        )}

        {/* ---- マイページタブ ---- */}
        {pageTab === TAB_MYPAGE && (
          <>
            {loading ? (
              <div style={styles.loading}>よみこみちゅう…</div>
            ) : (
              <>
                <BadgePanel badges={badges} />
                <RewardShop
                  rewards={rewards}
                  points={points}
                  onRedeemed={loadData}
                />
                <div style={styles.signOutLink} onClick={signOut}>ログアウト</div>
              </>
            )}
          </>
        )}
      </div>

      {/* 提案するボタン（ミッションタブのみ固定表示） */}
      {pageTab === TAB_MISSION && (
        <button
          style={{
            ...styles.proposeBtn,
            opacity: todayProposals >= PROPOSAL_LIMIT ? 0.5 : 1,
          }}
          onClick={() => setShowProposalForm(true)}
          disabled={todayProposals >= PROPOSAL_LIMIT}
        >
          💡 ていあんする
          {todayProposals > 0 && (
            <span style={styles.proposalCount}>
              {todayProposals}/{PROPOSAL_LIMIT}
            </span>
          )}
        </button>
      )}

      {/* 提案フォーム */}
      {showProposalForm && (
        <ProposalForm
          onSubmit={handlePropose}
          onClose={() => setShowProposalForm(false)}
          submitting={submittingProposal}
        />
      )}

      {/* バッジ取得モーダル */}
      {currentBadgeDef && (
        <div style={styles.badgeModalOverlay} onClick={closeBadgeModal}>
          <div style={styles.badgeModal} onClick={e => e.stopPropagation()}>
            <span style={styles.badgeModalEmoji}>{currentBadgeDef.icon}</span>
            <div style={styles.badgeModalTitle}>🎉 バッジゲット！</div>
            <div style={styles.badgeModalLabel}>{currentBadgeDef.label}</div>
            <div style={styles.badgeModalDesc}>{currentBadgeDef.desc}</div>
            <button
              style={{
                marginTop: '1.25rem',
                padding: '0.7rem 2rem',
                background: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: 'auto',
                boxShadow: '0 3px 12px rgba(255,143,0,0.4)',
              }}
              onClick={closeBadgeModal}
            >
              {badgeModalIdx < newBadges.length - 1 ? 'つぎへ →' : 'やったー！'}
            </button>
          </div>
        </div>
      )}

      {/* 通知スケジュールモーダル */}
      {showNotifInfo && (
        <NotificationScheduleModal onClose={() => setShowNotifInfo(false)} />
      )}
    </div>
  )
}
