/**
 * Google Sheets API ラッパー
 * スプレッドシートをデータベースとして使用する
 */

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

// シート名の定義
export const SHEETS = {
  USERS: 'users',
  TASKS: 'tasks',
  TASK_LOGS: 'task_logs',
  NOTIFICATIONS: 'notifications',
  REWARDS: 'rewards',
}

// アクセストークン（OAuth後に設定される）
let accessToken = null
export function setAccessToken(token) {
  accessToken = token
}

// 認証ヘッダー
function authHeaders() {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

/**
 * シートからデータを取得する
 * @param {string} sheetName - シート名
 * @param {string} range - A1形式の範囲（例: 'A2:Z'）
 * @returns {Array<Array>} 2次元配列
 */
export async function getRows(sheetName, range = '') {
  const rangeStr = range ? `${sheetName}!${range}` : sheetName
  const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(rangeStr)}?key=${API_KEY}`

  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Sheets API エラー: ${res.status}`)

  const data = await res.json()
  return data.values || []
}

/**
 * シートに行を追加する
 * @param {string} sheetName - シート名
 * @param {Array} row - 追加する行データ
 */
export async function appendRow(sheetName, row) {
  const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ values: [row] }),
  })
  if (!res.ok) throw new Error(`Sheets API エラー: ${res.status}`)
  return res.json()
}

/**
 * 指定行を更新する
 * @param {string} sheetName - シート名
 * @param {number} rowIndex - 行番号（1始まり）
 * @param {Array} row - 更新データ
 */
export async function updateRow(sheetName, rowIndex, row) {
  const range = `${sheetName}!A${rowIndex}`
  const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED&key=${API_KEY}`

  const res = await fetch(url, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ values: [row] }),
  })
  if (!res.ok) throw new Error(`Sheets API エラー: ${res.status}`)
  return res.json()
}

// ============================================================
// タスク操作
// ============================================================

// tasksシートのヘッダー列順
const TASK_COLUMNS = [
  'task_id', 'title', 'description', 'type', 'recurrence',
  'time_block', 'assigned_to', 'created_by', 'created_by_role',
  'approval_status', 'due_date', 'point_value', 'require_approval',
  'icon', 'status'
]

function rowToTask(row) {
  return Object.fromEntries(TASK_COLUMNS.map((key, i) => [key, row[i] || '']))
}

function taskToRow(task) {
  return TASK_COLUMNS.map(key => task[key] || '')
}

/** 全タスクを取得 */
export async function getTasks() {
  const rows = await getRows(SHEETS.TASKS, 'A2:O')
  return rows.map(rowToTask)
}

/** 特定ユーザーへのタスクを取得 */
export async function getTasksForUser(userId) {
  const tasks = await getTasks()
  return tasks.filter(t => t.assigned_to === userId && t.status === 'active')
}

/** 今日のタスクを時間帯で取得 */
export async function getTasksByTimeBlock(userId, timeBlock) {
  const tasks = await getTasksForUser(userId)
  return tasks.filter(t => t.time_block === timeBlock && t.approval_status !== 'pending')
}

/** 承認待ちの子どもからの提案を取得（親用） */
export async function getPendingProposals(parentId) {
  const tasks = await getTasks()
  return tasks.filter(t => t.approval_status === 'pending')
  // TODO: 子どものparent_idとparentIdを照合する
}

/** タスクを新規作成 */
export async function createTask(task) {
  const taskId = `task_${Date.now()}`
  const newTask = {
    ...task,
    task_id: taskId,
    status: 'active',
    created_at: new Date().toISOString(),
  }
  await appendRow(SHEETS.TASKS, taskToRow(newTask))
  return newTask
}

/** タスクの承認ステータスを更新 */
export async function updateTaskApproval(taskId, status, pointValue) {
  const rows = await getRows(SHEETS.TASKS, 'A2:O')
  const rowIndex = rows.findIndex(r => r[0] === taskId)
  if (rowIndex === -1) throw new Error('タスクが見つかりません')

  const updated = [...rows[rowIndex]]
  updated[9] = status        // approval_status
  updated[11] = pointValue   // point_value
  await updateRow(SHEETS.TASKS, rowIndex + 2, updated)
}

// ============================================================
// 完了ログ操作
// ============================================================

/** タスク完了を記録 */
export async function logTaskCompletion(taskId, userId, pointsEarned) {
  const log = [
    `log_${Date.now()}`,
    taskId,
    userId,
    new Date().toISOString(),
    '',  // approved_by（後で更新）
    '',  // approved_at
    pointsEarned,
  ]
  await appendRow(SHEETS.TASK_LOGS, log)
}

/** ユーザーのポイント合計を取得 */
export async function getUserPoints(userId) {
  const rows = await getRows(SHEETS.TASK_LOGS, 'A2:G')
  return rows
    .filter(r => r[1] === userId)
    .reduce((sum, r) => sum + Number(r[6] || 0), 0)
}

/** 連続達成日数（ストリーク）を計算 */
export async function getStreak(userId) {
  const rows = await getRows(SHEETS.TASK_LOGS, 'A2:G')
  const logs = rows
    .filter(r => r[1] === userId && r[3])
    .map(r => new Date(r[3]).toDateString())

  const uniqueDates = [...new Set(logs)].sort().reverse()
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr)
    const diff = (current - date) / (1000 * 60 * 60 * 24)
    if (diff <= 1) {
      streak++
      current = date
    } else {
      break
    }
  }
  return streak
}
