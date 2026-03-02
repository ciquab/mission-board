function isTrueLike(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    return v === 'true' || v === '1' || v === 'yes'
  }
  return false
}

const TIME_BLOCK_LABELS = {
  morning: '🌅 朝',
  afternoon: '☀️ 昼',
  evening: '🌇 夕方',
  night: '🌙 夜',
  bedtime: '🛏 就寝前',
}

const TYPE_LABELS = {
  routine: 'ルーティン',
  spot: 'スポット',
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function formatRecurrence(recurrence) {
  if (!recurrence || recurrence === 'daily') return '毎日'
  if (recurrence === 'weekly') return '毎週'
  if (recurrence.startsWith('weekly:')) {
    const days = recurrence.split(':')[1].split(',').map(Number).map(d => DAY_NAMES[d])
    return '毎週 ' + days.join('・')
  }
  if (recurrence.startsWith('monthly:')) {
    return `毎月${recurrence.split(':')[1]}日`
  }
  return recurrence
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  icon: {
    fontSize: '2rem',
    flexShrink: 0,
    lineHeight: 1,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: 'bold',
    fontSize: '0.95rem',
    color: '#222',
    marginBottom: '0.25rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badge: (color) => ({
    fontSize: '0.72rem',
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
    background: color + '20',
    color: color,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  }),
  assignee: {
    fontSize: '0.78rem',
    color: '#888',
  },
  description: {
    fontSize: '0.82rem',
    color: '#666',
    marginTop: '0.35rem',
    lineHeight: 1.4,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flexShrink: 0,
  },
  editBtn: {
    padding: '0.4rem 0.75rem',
    background: '#EBF2FA',
    color: '#2E75B6',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    minHeight: 'auto',
  },
  deleteBtn: {
    padding: '0.4rem 0.75rem',
    background: '#FEEBEE',
    color: '#F44336',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    minHeight: 'auto',
  },
}

export default function TaskCard({ task, assigneeName, onEdit, onDelete }) {
  return (
    <div style={styles.card}>
      <div style={styles.icon}>{task.icon || '⭐'}</div>
      <div style={styles.body}>
        <div style={styles.title}>{task.title}</div>
        <div style={styles.meta}>
          <span style={styles.badge('#2E75B6')}>{TIME_BLOCK_LABELS[task.time_block] || task.time_block}</span>
          <span style={styles.badge('#666')}>{TYPE_LABELS[task.type] || task.type}</span>
          {task.type === 'routine' && (
            <span style={styles.badge('#4CAF50')}>{formatRecurrence(task.recurrence)}</span>
          )}
          <span style={styles.badge('#FFB300')}>{task.point_value}pt</span>
          {isTrueLike(task.require_approval) && (
            <span style={styles.badge('#9C27B0')}>承認必要</span>
          )}
        </div>
        {assigneeName && (
          <div style={styles.assignee}>担当: {assigneeName}</div>
        )}
        {task.description && (
          <div style={styles.description}>{task.description}</div>
        )}
      </div>
      <div style={styles.actions}>
        <button style={styles.editBtn} onClick={() => onEdit(task)}>編集</button>
        <button style={styles.deleteBtn} onClick={() => onDelete(task.task_id)}>削除</button>
      </div>
    </div>
  )
}
