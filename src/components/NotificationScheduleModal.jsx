/**
 * 通知スケジュール説明モーダル
 * 親・子ども両方のヘッダーの ℹ️ ボタンから呼び出す
 */
export default function NotificationScheduleModal({ onClose }) {
  const schedule = [
    { time_block: '🌅 朝', time: '07:15', desc: 'morning タスクのリマインド' },
    { time_block: '☀️ 昼', time: '14:45', desc: 'afternoon タスクのリマインド' },
    { time_block: '🌇 夕方', time: '16:45', desc: 'evening タスクのリマインド' },
    { time_block: '🌙 夜', time: '18:45', desc: 'night タスクのリマインド' },
    { time_block: '🛏 就寝前', time: '20:45', desc: 'bedtime タスクのリマインド' },
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#333' }}>
            🔔 通知スケジュール
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#999', padding: '0.2rem', minHeight: 'auto' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem', lineHeight: 1.6 }}>
          毎日、タスクの時間帯に合わせて以下の時刻に通知が届きます。
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem', color: '#888', fontWeight: 'bold' }}>時間帯</th>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem', color: '#888', fontWeight: 'bold' }}>通知時刻</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map(row => (
              <tr key={row.time_block} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '0.6rem 0.4rem' }}>{row.time_block}</td>
                <td style={{ padding: '0.6rem 0.4rem', fontWeight: 'bold', color: '#2E75B6' }}>{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: '#F5F7FA', borderRadius: '8px', fontSize: '0.8rem', color: '#666', lineHeight: 1.7 }}>
          <strong>その他の通知：</strong><br />
          ・タスク完了時 → 親に確認通知<br />
          ・ミッション提案時 → 親に承認依頼通知<br />
          ・提案の承認・却下 → 子どもに結果通知<br />
          ・連続達成時 → ストリーク通知
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: '1rem', padding: '0.75rem',
            background: '#2E75B6', color: '#fff', border: 'none',
            borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem',
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
