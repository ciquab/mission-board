import { fireConfetti } from '../../utils/confetti'

const styles = {
  card: (completed) => ({
    background: completed ? '#F1F8E9' : '#fff',
    borderRadius: '18px',
    padding: '1.25rem',
    boxShadow: completed ? 'none' : '0 4px 16px rgba(0,0,0,0.10)',
    border: `2px solid ${completed ? '#C5E1A5' : 'transparent'}`,
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    opacity: completed ? 0.72 : 1,
    transition: 'all 0.3s ease',
  }),
  icon: {
    fontSize: '3rem',
    lineHeight: 1,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#222',
    marginBottom: '0.35rem',
    lineHeight: 1.3,
  },
  pointBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
    fontSize: '0.85rem',
    background: '#FFF8E1',
    color: '#F57F17',
    padding: '0.2rem 0.65rem',
    borderRadius: '999px',
    fontWeight: 'bold',
  },
  description: {
    fontSize: '0.9rem',
    color: '#777',
    marginTop: '0.4rem',
    lineHeight: 1.45,
  },
  completeBtn: {
    height: '56px',
    padding: '0 1.4rem',
    background: 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    boxShadow: '0 4px 14px rgba(46,125,50,0.4)',
    transition: 'transform 0.1s, opacity 0.1s',
    minHeight: 'unset',
  },
  completedMark: {
    fontSize: '2.2rem',
    flexShrink: 0,
  },
  pendingMark: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.15rem',
    flexShrink: 0,
  },
  pendingEmoji: {
    fontSize: '2rem',
    lineHeight: 1,
  },
  pendingLabel: {
    fontSize: '0.65rem',
    color: '#F57F17',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
}

export default function MissionCard({ task, completed, pendingApproval, onComplete, completing }) {
  function handleClick() {
    if (completing) return
    fireConfetti()
    onComplete(task.task_id, task.point_value)
  }

  return (
    <div style={styles.card(completed)}>
      <div style={styles.icon} className="mission-icon">{task.icon || '⭐'}</div>
      <div style={styles.body}>
        <div style={styles.title}>{task.title}</div>
        <span style={styles.pointBadge}>⭐ +{task.point_value || 0}pt</span>
        {task.description && (
          <div style={styles.description}>{task.description}</div>
        )}
      </div>
      {completed ? (
        pendingApproval ? (
          <div style={styles.pendingMark}>
            <span style={styles.pendingEmoji}>⏳</span>
            <span style={styles.pendingLabel}>しんさちゅう</span>
          </div>
        ) : (
          <div style={styles.completedMark}>✅</div>
        )
      ) : (
        <button
          style={{ ...styles.completeBtn, opacity: completing ? 0.7 : 1 }}
          className="mission-complete-btn"
          onClick={handleClick}
          disabled={completing}
        >
          {completing ? '…' : 'できた！'}
        </button>
      )}
    </div>
  )
}
