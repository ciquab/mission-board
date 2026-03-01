const styles = {
  card: {
    background: '#fff',
    borderRadius: '14px',
    padding: '1.1rem 1.25rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2E75B6, #1565C0)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: 'bold',
    fontSize: '1rem',
    color: '#222',
    marginBottom: '0.4rem',
  },
  stats: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  stat: {
    fontSize: '0.78rem',
    background: '#EBF2FA',
    color: '#2E75B6',
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    fontWeight: 'bold',
  },
  pendingStat: {
    background: '#FFF8E1',
    color: '#F57F17',
  },
  noTaskStat: {
    background: '#F5F5F5',
    color: '#999',
  },
  pointsStat: {
    background: 'linear-gradient(135deg, #FFF8E1, #FFF3CD)',
    color: '#E65100',
    border: '1px solid #FFE082',
  },
  badge: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#F44336',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
}

export default function ChildProgressCard({ child, taskCount, proposalCount, points }) {
  const initial = child.name ? child.name[0].toUpperCase() : '?'

  return (
    <div style={styles.card}>
      <div style={styles.avatar}>{initial}</div>
      <div style={styles.body}>
        <div style={styles.name}>{child.name}</div>
        <div style={styles.stats}>
          {taskCount > 0 ? (
            <span style={styles.stat}>📋 タスク {taskCount}件</span>
          ) : (
            <span style={{ ...styles.stat, ...styles.noTaskStat }}>タスクなし</span>
          )}
          {proposalCount > 0 && (
            <span style={{ ...styles.stat, ...styles.pendingStat }}>
              💡 承認待ち {proposalCount}件
            </span>
          )}
          {points != null && (
            <span style={{ ...styles.stat, ...styles.pointsStat }}>
              ⭐ {points} pt
            </span>
          )}
        </div>
      </div>
      {proposalCount > 0 && (
        <div style={styles.badge}>{proposalCount}</div>
      )}
    </div>
  )
}
