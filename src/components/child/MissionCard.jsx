const styles = {
  card: (completed) => ({
    background: completed ? '#E8F5E9' : '#fff',
    borderRadius: '14px',
    padding: '1.25rem',
    boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    opacity: completed ? 0.7 : 1,
    transition: 'opacity 0.3s',
  }),
  icon: {
    fontSize: '2.5rem',
    lineHeight: 1,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#222',
    marginBottom: '0.3rem',
    lineHeight: 1.3,
  },
  meta: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  pointBadge: {
    fontSize: '0.8rem',
    background: '#FFF8E1',
    color: '#F57F17',
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
    fontWeight: 'bold',
  },
  pendingBadge: {
    fontSize: '0.8rem',
    background: '#FFF3E0',
    color: '#E65100',
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
  },
  description: {
    fontSize: '0.85rem',
    color: '#666',
    marginTop: '0.35rem',
    lineHeight: 1.4,
  },
  completeBtn: {
    padding: '0.65rem 1.1rem',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    boxShadow: '0 3px 8px rgba(76,175,80,0.35)',
    transition: 'transform 0.1s, box-shadow 0.1s',
  },
  completedMark: {
    fontSize: '2rem',
    flexShrink: 0,
  },
}

export default function MissionCard({ task, completed, onComplete, completing }) {
  return (
    <div style={styles.card(completed)}>
      <div style={styles.icon}>{task.icon || '⭐'}</div>
      <div style={styles.body}>
        <div style={styles.title}>{task.title}</div>
        <div style={styles.meta}>
          <span style={styles.pointBadge}>+{task.point_value || 0}pt</span>
          {task.approval_status === 'pending' && (
            <span style={styles.pendingBadge}>おや がかくにんちゅう</span>
          )}
        </div>
        {task.description && (
          <div style={styles.description}>{task.description}</div>
        )}
      </div>
      {completed ? (
        <div style={styles.completedMark}>✅</div>
      ) : (
        <button
          style={{
            ...styles.completeBtn,
            opacity: completing ? 0.7 : 1,
          }}
          onClick={() => !completing && onComplete(task.task_id, task.point_value)}
          disabled={completing}
        >
          {completing ? '…' : 'できた！'}
        </button>
      )}
    </div>
  )
}
