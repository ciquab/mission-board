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
  BADGES: 'badges',
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
 * Sheets API レスポンスのエラーハンドリング
 * 401 の場合はトークン期限切れイベントを発火してログアウトを促す
 */
function handleApiError(res) {
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('missionboard:token-expired'))
    throw new Error('ログインの有効期限が切れました。再度ログインしてください。')
  }
  throw new Error(`Sheets API エラー: ${res.status}`)
}

/**
 * シートからデータを取得する（OAuthトークン使用）
 * @param {string} sheetName - シート名
 * @param {string} range - A1形式の範囲（例: 'A2:Z'）
 * @returns {Array<Array>} 2次元配列
 */
export async function getRows(sheetName, range = '') {
  const rangeStr = range ? `${sheetName}!${range}` : sheetName
  const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(rangeStr)}?key=${API_KEY}`

  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) handleApiError(res)

  const data = await res.json()
  return data.values || []
}

/**
 * シートからデータを取得する（APIキーのみ・認証不要）
 * スプレッドシートが「リンクを知っている全員が閲覧可能」に設定されている場合に使用
 * 子どもの登録フローなど、まだスプレッドシートへのアクセス権がない場合に利用する
 */
async function getRowsPublic(sheetName, range = '') {
  const rangeStr = range ? `${sheetName}!${range}` : sheetName
  const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(rangeStr)}?key=${API_KEY}`

  const res = await fetch(url)  // Authヘッダーなし（APIキーのみ）
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('スプレッドシートの共有設定を「リンクを知っている全員が閲覧可能」に変更してください（Google スプレッドシート → 共有 → リンクを取得）')
    }
    throw new Error(`Sheets API エラー: ${res.status}`)
  }

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
  if (!res.ok) handleApiError(res)
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
  if (!res.ok) handleApiError(res)
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
  const [tasks, userRows] = await Promise.all([
    getTasks(),
    getRows(SHEETS.USERS, 'A2:G'),
  ])
  // parentId に紐づく子どものIDリストを取得してフィルタリング
  const childIds = userRows
    .filter(r => r[4] === parentId)
    .map(r => r[0])
  return tasks.filter(t =>
    t.approval_status === 'pending' && childIds.includes(t.created_by)
  )
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

/** タスクを全フィールド更新 */
export async function updateTask(taskId, updates) {
  const rows = await getRows(SHEETS.TASKS, 'A2:O')
  const rowIndex = rows.findIndex(r => r[0] === taskId)
  if (rowIndex === -1) throw new Error('タスクが見つかりません')

  const current = rowToTask(rows[rowIndex])
  const updated = { ...current, ...updates }
  await updateRow(SHEETS.TASKS, rowIndex + 2, taskToRow(updated))
  return updated
}

/** タスクをアーカイブ（論理削除） */
export async function archiveTask(taskId) {
  return updateTask(taskId, { status: 'archived' })
}

// ============================================================
// ユーザー操作
// ============================================================

// usersシートの列順
const USER_COLUMNS = [
  'user_id', 'name', 'role', 'email', 'parent_id', 'push_endpoint', 'created_at'
]

function rowToUser(row) {
  return Object.fromEntries(USER_COLUMNS.map((key, i) => [key, row[i] ?? '']))
}

function userToRow(user) {
  return USER_COLUMNS.map(key => user[key] ?? '')
}

/** メールアドレスでユーザーを検索（大文字小文字を無視・APIキーのみで読み取り）
 * ログイン前・子ども登録フローなど、まだスプレッドシート権限がない状態でも動作する
 */
export async function getUserByEmail(email) {
  // まず認証ありで試み、403の場合はAPIキーのみにフォールバック
  let rows
  try {
    rows = await getRows(SHEETS.USERS, 'A2:G')
  } catch (e) {
    if (e.message.includes('403') || e.message.includes('401')) {
      rows = await getRowsPublic(SHEETS.USERS, 'A2:G')
    } else {
      throw e
    }
  }
  const normalized = email.trim().toLowerCase()
  const row = rows.find(r => (r[3] || '').trim().toLowerCase() === normalized)
  return row ? rowToUser(row) : null
}

/** 新規ユーザーを登録 */
export async function registerUser(userData) {
  await appendRow(SHEETS.USERS, userToRow(userData))
  return userData
}

/** ユーザー情報を更新 */
export async function updateUser(userId, updates) {
  const rows = await getRows(SHEETS.USERS, 'A2:G')
  const rowIndex = rows.findIndex(r => r[0] === userId)
  if (rowIndex === -1) throw new Error('ユーザーが見つかりません')

  const current = rowToUser(rows[rowIndex])
  const updated = { ...current, ...updates }
  await updateRow(SHEETS.USERS, rowIndex + 2, userToRow(updated))
  return updated
}

/** 親IDに紐づく子どもを取得（parent_id はカンマ区切りで複数親対応） */
export async function getChildren(parentId) {
  const rows = await getRows(SHEETS.USERS, 'A2:G')
  return rows.filter(r => (r[4] || '').split(',').includes(parentId)).map(rowToUser)
}

/** 子どもに親を追加リンク（複数親対応） */
export async function addParentToChild(childEmail, newParentId) {
  const rows = await getRows(SHEETS.USERS, 'A2:G')
  const rowIndex = rows.findIndex(
    r => (r[3] || '').trim().toLowerCase() === childEmail.trim().toLowerCase() && r[2] === 'child'
  )
  if (rowIndex === -1) throw new Error('こどものアカウントが見つかりません')

  const currentParents = (rows[rowIndex][4] || '').split(',').filter(Boolean)
  if (currentParents.includes(newParentId)) throw new Error('すでにリンク済みです')

  currentParents.push(newParentId)
  const updated = [...rows[rowIndex]]
  updated[4] = currentParents.join(',')
  await updateRow(SHEETS.USERS, rowIndex + 2, updated)
}

/** FCM トークンを users シートの push_endpoint カラムに保存する */
export async function updateUserFcmToken(userId, fcmToken) {
  const rows = await getRows(SHEETS.USERS, 'A2:G')
  const rowIndex = rows.findIndex(r => r[0] === userId)
  if (rowIndex === -1) throw new Error('ユーザーが見つかりません')

  // push_endpoint（インデックス5）のみ更新
  const updated = [...rows[rowIndex]]
  updated[5] = fcmToken
  await updateRow(SHEETS.USERS, rowIndex + 2, updated)
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

// ============================================================
// バッジ操作
// ============================================================

// badgesシートの列順
const BADGE_COLUMNS = ['badge_id', 'user_id', 'badge_type', 'earned_at']

function rowToBadge(row) {
  return Object.fromEntries(BADGE_COLUMNS.map((key, i) => [key, row[i] || '']))
}

/** ユーザーの取得済みバッジ一覧を取得 */
export async function getBadges(userId) {
  try {
    const rows = await getRows(SHEETS.BADGES, 'A2:D')
    return rows.filter(r => r[1] === userId).map(rowToBadge)
  } catch (e) {
    // badges シートがまだ存在しない場合（400）は空配列を返す
    if (e.message.includes('400')) return []
    throw e
  }
}

/** バッジを付与する（重複チェック付き） */
export async function awardBadge(userId, badgeType) {
  const existing = await getBadges(userId)
  if (existing.some(b => b.badge_type === badgeType)) return null  // すでに持っている

  const badge = {
    badge_id: `badge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user_id: userId,
    badge_type: badgeType,
    earned_at: new Date().toISOString(),
  }
  await appendRow(SHEETS.BADGES, BADGE_COLUMNS.map(k => badge[k]))
  return badge
}

/**
 * 条件を満たす未取得バッジを一括チェック・付与する
 * @param {string} userId
 * @param {number} totalPoints - 累計ポイント
 * @param {number} streak - 連続達成日数
 * @param {boolean} allTasksDone - 本日の全タスク完了フラグ
 * @returns {string[]} 新規取得したバッジの badge_type 配列
 */
export async function checkAndAwardBadges(userId, totalPoints, streak, allTasksDone) {
  const existing = await getBadges(userId)
  const has = (type) => existing.some(b => b.badge_type === type)

  const candidates = []

  // 初ミッション：ポイントが0より大きく、まだ持っていない
  if (totalPoints > 0 && !has('first_mission')) candidates.push('first_mission')

  // ストリーク系
  if (streak >= 3 && !has('streak_3')) candidates.push('streak_3')
  if (streak >= 7 && !has('streak_7')) candidates.push('streak_7')
  if (streak >= 30 && !has('streak_30')) candidates.push('streak_30')

  // ポイント系
  if (totalPoints >= 10 && !has('points_10')) candidates.push('points_10')
  if (totalPoints >= 50 && !has('points_50')) candidates.push('points_50')
  if (totalPoints >= 100 && !has('points_100')) candidates.push('points_100')

  // 全タスク完了
  if (allTasksDone && !has('all_done')) candidates.push('all_done')

  // 付与（直列で実行して重複を防ぐ）
  const awarded = []
  for (const type of candidates) {
    const result = await awardBadge(userId, type)
    if (result) awarded.push(type)
  }
  return awarded
}

// ============================================================
// ご褒美操作
// ============================================================

// rewardsシートの列順
const REWARD_COLUMNS = [
  'reward_id', 'title', 'point_cost', 'created_by', 'assigned_to', 'status'
]

function rowToReward(row) {
  return Object.fromEntries(REWARD_COLUMNS.map((key, i) => [key, row[i] || '']))
}

function rewardToRow(reward) {
  return REWARD_COLUMNS.map(k => reward[k] || '')
}

/** 子ども向けご褒美一覧を取得（active + pending） */
export async function getRewards(assignedTo) {
  try {
    const rows = await getRows(SHEETS.REWARDS, 'A2:F')
    return rows
      .map(rowToReward)
      .filter(r => r.assigned_to === assignedTo && (r.status === 'active' || r.status === 'pending'))
  } catch (e) {
    // rewards シートがまだ存在しない場合（400）は空配列を返す
    if (e.message.includes('400')) return []
    throw e
  }
}

/** 親向け：自分が作成したご褒美の申請一覧を取得（status: pending） */
export async function getRewardRequests(createdBy) {
  const rows = await getRows(SHEETS.REWARDS, 'A2:F')
  return rows
    .map(rowToReward)
    .filter(r => r.created_by === createdBy && r.status === 'pending')
}

/** 親向け：自分が作成したすべてのご褒美を取得 */
export async function getAllRewardsByParent(createdBy) {
  const rows = await getRows(SHEETS.REWARDS, 'A2:F')
  return rows.map(rowToReward).filter(r => r.created_by === createdBy)
}

/** 親がご褒美を新規作成 */
export async function createReward(title, pointCost, createdBy, assignedTo) {
  const reward = {
    reward_id: `reward_${Date.now()}`,
    title,
    point_cost: String(pointCost),
    created_by: createdBy,
    assigned_to: assignedTo,
    status: 'active',
  }
  await appendRow(SHEETS.REWARDS, rewardToRow(reward))
  return reward
}

/** 子どもが申請 → status: 'pending' に更新 */
export async function requestRewardRedemption(rewardId) {
  const rows = await getRows(SHEETS.REWARDS, 'A2:F')
  const rowIndex = rows.findIndex(r => r[0] === rewardId)
  if (rowIndex === -1) throw new Error('ご褒美が見つかりません')

  const updated = [...rows[rowIndex]]
  updated[5] = 'pending'
  await updateRow(SHEETS.REWARDS, rowIndex + 2, updated)
}

/** 親がご褒美ステータスを更新（承認: redeemed / 却下: active に戻す） */
export async function updateRewardStatus(rewardId, status) {
  const rows = await getRows(SHEETS.REWARDS, 'A2:F')
  const rowIndex = rows.findIndex(r => r[0] === rewardId)
  if (rowIndex === -1) throw new Error('ご褒美が見つかりません')

  const updated = [...rows[rowIndex]]
  updated[5] = status
  await updateRow(SHEETS.REWARDS, rowIndex + 2, updated)
}

/** 親がご褒美のタイトル・ポイントを編集 */
export async function updateReward(rewardId, title, pointCost) {
  const rows = await getRows(SHEETS.REWARDS, 'A2:F')
  const rowIndex = rows.findIndex(r => r[0] === rewardId)
  if (rowIndex === -1) throw new Error('ご褒美が見つかりません')

  const updated = [...rows[rowIndex]]
  updated[1] = title
  updated[2] = String(pointCost)
  await updateRow(SHEETS.REWARDS, rowIndex + 2, updated)
}

/** 親がご褒美を削除（論理削除: archived） */
export async function archiveReward(rewardId) {
  return updateRewardStatus(rewardId, 'archived')
}
