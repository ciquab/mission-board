import { useState } from 'react'

const styles = {
  card: {
    background: '#FFF8E1',
    border: '2px solid #FFB300',
    borderRadius: '12px',
    padding: '1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  icon: {
    fontSize: '2rem',
    lineHeight: 1,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: 'bold',
    fontSize: '0.95rem',
    color: '#222',
    marginBottom: '0.2rem',
  },
  proposer: {
    fontSize: '0.8rem',
    color: '#888',
  },
  description: {
    fontSize: '0.85rem',
    color: '#555',
    marginBottom: '0.75rem',
    lineHeight: 1.5,
  },
  approveSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  pointLabel: {
    fontSize: '0.85rem',
    color: '#555',
    whiteSpace: 'nowrap',
  },
  pointInput: {
    width: '70px',
    padding: '0.4rem 0.5rem',
    border: '1.5px solid #FFB300',
    borderRadius: '6px',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  approveBtn: {
    padding: '0.45rem 1rem',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    minHeight: 'auto',
  },
  rejectBtn: {
    padding: '0.45rem 1rem',
    background: '#fff',
    color: '#F44336',
    border: '1.5px solid #F44336',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    minHeight: 'auto',
  },
}

export default function ProposalCard({ task, proposerName, onApprove, onReject }) {
  const [pointValue, setPointValue] = useState(task.point_value || '3')

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.icon}>{task.icon || '💡'}</div>
        <div style={styles.info}>
          <div style={styles.title}>{task.title}</div>
          <div style={styles.proposer}>提案者: {proposerName || task.created_by}</div>
        </div>
      </div>

      {task.description && (
        <div style={styles.description}>{task.description}</div>
      )}

      <div style={styles.approveSection}>
        <span style={styles.pointLabel}>ポイント:</span>
        <input
          style={styles.pointInput}
          type="number"
          min="1"
          max="5"
          value={pointValue}
          onChange={e => setPointValue(e.target.value)}
        />
        <button
          style={styles.approveBtn}
          onClick={() => onApprove(task.task_id, pointValue)}
        >
          承認する
        </button>
        <button
          style={styles.rejectBtn}
          onClick={() => onReject(task.task_id)}
        >
          却下する
        </button>
      </div>
    </div>
  )
}
