import { getBadgeDef, BADGE_DEFS } from '../../utils/badges'

const styles = {
  container: {
    padding: '0.25rem 0',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.65rem',
  },
  badgeItem: (earned) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.75rem 0.4rem',
    background: earned ? '#fff' : '#f0f0f0',
    borderRadius: '12px',
    boxShadow: earned ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
    opacity: earned ? 1 : 0.45,
    filter: earned ? 'none' : 'grayscale(100%)',
    transition: 'all 0.2s',
  }),
  badgeIcon: (earned) => ({
    fontSize: earned ? '2rem' : '1.8rem',
    lineHeight: 1,
  }),
  badgeLabel: {
    fontSize: '0.65rem',
    color: '#555',
    textAlign: 'center',
    lineHeight: 1.3,
  },
  earnedAt: {
    fontSize: '0.6rem',
    color: '#aaa',
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: '#aaa',
    fontSize: '0.9rem',
    lineHeight: 1.7,
  },
}

/**
 * 子ども用バッジ一覧パネル
 * @param {Object[]} badges - getBadges() で取得したバッジ配列
 */
export default function BadgePanel({ badges }) {
  // 全バッジ種類に対して、取得済みかどうかをマップ
  const earnedMap = {}
  badges.forEach(b => { earnedMap[b.badge_type] = b })

  const allTypes = Object.keys(BADGE_DEFS)
  const earnedCount = allTypes.filter(t => earnedMap[t]).length

  return (
    <div style={styles.container}>
      <div style={styles.sectionTitle}>
        🏅 バッジ
        <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>
          {earnedCount} / {allTypes.length}こ
        </span>
      </div>

      <div style={styles.grid} className="badge-grid">
        {allTypes.map(type => {
          const def = getBadgeDef(type)
          const earned = earnedMap[type]
          const earnedDate = earned
            ? new Date(earned.earned_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
            : null

          return (
            <div key={type} style={styles.badgeItem(!!earned)} title={def.desc}>
              <span style={styles.badgeIcon(!!earned)}>{def.icon}</span>
              <span style={styles.badgeLabel}>{def.label}</span>
              {earnedDate && (
                <span style={styles.earnedAt}>{earnedDate}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
