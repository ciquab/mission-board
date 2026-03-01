import { useState } from 'react'
import { requestRewardRedemption } from '../../api/sheets'

const styles = {
  container: {
    padding: '0.25rem 0',
    marginTop: '1.5rem',
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
  empty: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: '#aaa',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    background: '#f9f9f9',
    borderRadius: '12px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  card: (status, canAfford) => ({
    background: '#fff',
    borderRadius: '14px',
    padding: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    opacity: (status === 'redeemed' || (!canAfford && status === 'active')) ? 0.65 : 1,
    border: status === 'pending' ? '2px solid #FFB300' : '2px solid transparent',
  }),
  icon: {
    fontSize: '2rem',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.2rem',
    wordBreak: 'break-word',
  },
  cost: (canAfford) => ({
    fontSize: '0.88rem',
    color: canAfford ? '#FFB300' : '#bbb',
    fontWeight: 'bold',
  }),
  statusBadge: (status) => ({
    display: 'inline-block',
    fontSize: '0.72rem',
    background: status === 'pending' ? '#FFF8E1' : status === 'redeemed' ? '#E8F5E9' : '#f0f0f0',
    color: status === 'pending' ? '#F57F17' : status === 'redeemed' ? '#2E7D32' : '#888',
    border: `1px solid ${status === 'pending' ? '#FFE082' : status === 'redeemed' ? '#A5D6A7' : '#ddd'}`,
    borderRadius: '999px',
    padding: '0.15rem 0.55rem',
    marginTop: '0.25rem',
  }),
  btn: (canAfford) => ({
    flexShrink: 0,
    padding: '0.55rem 1rem',
    background: canAfford
      ? 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)'
      : '#ddd',
    color: canAfford ? '#fff' : '#aaa',
    border: 'none',
    borderRadius: '999px',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    cursor: canAfford ? 'pointer' : 'not-allowed',
    whiteSpace: 'nowrap',
    minHeight: 'auto',
    boxShadow: canAfford ? '0 2px 8px rgba(255,143,0,0.4)' : 'none',
  }),
  error: {
    background: '#FEEBEE',
    color: '#C62828',
    padding: '0.65rem 0.9rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '0.75rem',
  },
}

/**
 * 子ども用ご褒美ショップ
 * @param {Object[]} rewards - getRewards() で取得したご褒美配列
 * @param {number} points - 現在の保有ポイント
 * @param {Function} onRedeemed - 申請後に呼ぶコールバック（リロード用）
 */
export default function RewardShop({ rewards, points, onRedeemed }) {
  const [requesting, setRequesting] = useState(null)
  const [error, setError] = useState('')

  async function handleRequest(rewardId) {
    setRequesting(rewardId)
    setError('')
    try {
      await requestRewardRedemption(rewardId)
      onRedeemed()
    } catch (e) {
      setError('こうかんのもうしこみに失敗したよ。' + e.message)
    } finally {
      setRequesting(null)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.sectionTitle}>🎁 ごほうびショップ</div>

      {error && <div style={styles.error}>{error}</div>}

      {rewards.length === 0 ? (
        <div style={styles.empty}>
          ごほうびがまだないよ。<br />
          おやにつくってもらおう！🎀
        </div>
      ) : (
        <div style={styles.list}>
          {rewards.map(reward => {
            const cost = Number(reward.point_cost)
            const canAfford = points >= cost
            const isPending = reward.status === 'pending'
            const isRedeemed = reward.status === 'redeemed'

            return (
              <div key={reward.reward_id} style={styles.card(reward.status, canAfford)}>
                <span style={styles.icon}>🎁</span>
                <div style={styles.info}>
                  <div style={styles.title}>{reward.title}</div>
                  <div style={styles.cost(canAfford)}>⭐ {cost} pt</div>
                  {isPending && (
                    <span style={styles.statusBadge('pending')}>もうしこみちゅう</span>
                  )}
                  {isRedeemed && (
                    <span style={styles.statusBadge('redeemed')}>こうかんずみ ✓</span>
                  )}
                </div>
                {!isPending && !isRedeemed && (
                  <button
                    style={styles.btn(canAfford)}
                    disabled={!canAfford || requesting === reward.reward_id}
                    onClick={() => handleRequest(reward.reward_id)}
                  >
                    {requesting === reward.reward_id ? '…' : 'こうかん！'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
