const TIME_BLOCK_LABELS = {
  morning: 'あさ',
  afternoon: 'ひる',
  evening: 'ゆうがた',
  night: 'よる',
  bedtime: 'ねるまえ',
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: '14px',
    padding: '1.1rem 1.25rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.6rem',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2E75B6, #1565C0)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginBottom: '0.3rem',
  },
  name: {
    fontWeight: 'bold',
    fontSize: '1rem',
    color: '#222',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pointsStat: {
    fontSize: '0.78rem',
    background: 'linear-gradient(135deg, #FFF8E1, #FFF3CD)',
    color: '#E65100',
    border: '1px solid #FFE082',
    padding: '0.15rem 0.55rem',
    borderRadius: '999px',
    fontWeight: 'bold',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  progressLabel: {
    fontSize: '0.78rem',
    color: '#888',
    whiteSpace: 'nowrap',
  },
  progressBg: {
    flex: 1,
    height: '6px',
    background: '#EEF2FA',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    height: '100%',
    background: pct >= 100 ? '#4CAF50' : '#2E75B6',
    borderRadius: '999px',
    width: `${pct}%`,
    transition: 'width 0.5s ease',
  }),
  taskList: {
    marginTop: '0.6rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  taskItem: (completed) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.82rem',
    color: completed ? '#bbb' : '#444',
    lineHeight: 1.4,
  }),
  taskCheck: (completed) => ({
    flexShrink: 0,
    fontSize: '0.85rem',
    opacity: completed ? 0.6 : 1,
  }),
  taskTitle: (completed) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textDecoration: completed ? 'line-through' : 'none',
  }),
  taskTimeBlock: {
    fontSize: '0.7rem',
    color: '#aaa',
    flexShrink: 0,
  },
  taskPoints: (completed) => ({
    fontSize: '0.7rem',
    color: completed ? '#ccc' : '#E65100',
    fontWeight: 'bold',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  }),
  noTaskMsg: {
    fontSize: '0.82rem',
    color: '#bbb',
    marginTop: '0.4rem',
  },
  pendingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.78rem',
    background: '#FFF8E1',
    color: '#F57F17',
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    fontWeight: 'bold',
    marginTop: '0.5rem',
  },
}

export default function ChildProgressCard({ child, todayTasks, proposalCount, pendingApprovalCount, points }) {
  const initial = child.name ? child.name[0].toUpperCase() : '?'
  const totalCount = todayTasks.length
  // 承認待ちは完了にカウントしない
  const doneCount = todayTasks.filter(t => t.completedToday && !t.pendingApproval).length
  const pendingCount = pendingApprovalCount || todayTasks.filter(t => t.pendingApproval).length
  const progressPct = totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0
  const totalPts = todayTasks.reduce((s, t) => s + Number(t.point_value || 0), 0)
  // 承認待ちのタスクはポイントに含めない
  const earnedPts = todayTasks.filter(t => t.completedToday && !t.pendingApproval).reduce((s, t) => s + Number(t.point_value || 0), 0)

  return (
    <div style={styles.card}>
      {/* ヘッダー：名前・ポイント・進捗バー */}
      <div style={styles.header}>
        <div style={styles.avatar}>{initial}</div>
        <div style={styles.headerBody}>
          <div style={styles.nameRow}>
            <div style={styles.name}>{child.name}</div>
            {points != null && (
              <span style={styles.pointsStat}>⭐ {points} pt</span>
            )}
          </div>
          {totalCount > 0 ? (
            <div style={styles.progressRow}>
              <span style={styles.progressLabel}>今日 {doneCount}/{totalCount}{totalPts > 0 && ` (${earnedPts}/${totalPts}pt)`}</span>
              <div style={styles.progressBg}>
                <div style={styles.progressFill(progressPct)} />
              </div>
            </div>
          ) : (
            <div style={styles.progressLabel}>今日のタスクはありません</div>
          )}
        </div>
      </div>

      {/* 今日のタスク一覧（未完了 → 承認待ち → 完了） */}
      {totalCount > 0 && (
        <div style={styles.taskList}>
          {todayTasks.map(task => (
            <div key={task.task_id} style={styles.taskItem(task.completedToday && !task.pendingApproval)}>
              <span style={styles.taskCheck(task.completedToday)}>
                {task.pendingApproval ? '⏳' : task.completedToday ? '✅' : '⬜'}
              </span>
              <span style={styles.taskCheck(task.completedToday)}>
                {task.icon || '📋'}
              </span>
              <span style={styles.taskTitle(task.completedToday && !task.pendingApproval)}>
                {task.title}
              </span>
              {task.time_block && (
                <span style={styles.taskTimeBlock}>
                  {TIME_BLOCK_LABELS[task.time_block] || task.time_block}
                </span>
              )}
              {Number(task.point_value) > 0 && (
                <span style={styles.taskPoints(task.completedToday && !task.pendingApproval)}>
                  {task.pendingApproval ? '承認待ち' : `${task.point_value}pt`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 完了承認待ち */}
      {pendingCount > 0 && (
        <div style={{ ...styles.pendingBadge, background: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7' }}>
          ⏳ 完了承認待ち {pendingCount}件
        </div>
      )}

      {/* 承認待ち提案 */}
      {proposalCount > 0 && (
        <div style={styles.pendingBadge}>
          💡 提案承認待ち {proposalCount}件
        </div>
      )}
    </div>
  )
}
