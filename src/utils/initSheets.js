/**
 * スプレッドシートの初期セットアップ
 * 各シートのヘッダー行が存在しない場合に書き込む
 * シートタブ自体が存在しない場合は batchUpdate で自動作成する
 */
import { getRows, updateRow } from '../api/sheets'

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

// 各シートのヘッダー定義（CLAUDE.md のデータ構造に準拠）
const SHEET_HEADERS = {
  users: [
    'user_id', 'name', 'role', 'email', 'parent_id', 'push_endpoint', 'created_at',
  ],
  tasks: [
    'task_id', 'title', 'description', 'type', 'recurrence',
    'time_block', 'assigned_to', 'created_by', 'created_by_role',
    'approval_status', 'due_date', 'point_value', 'require_approval', 'icon', 'status',
  ],
  task_logs: [
    'log_id', 'task_id', 'user_id', 'completed_at', 'approved_by', 'approved_at', 'points_earned',
  ],
  notifications: [
    'notification_id', 'task_id', 'user_id', 'type', 'scheduled_at', 'sent', 'sent_at',
  ],
  rewards: [
    'reward_id', 'title', 'point_cost', 'created_by', 'assigned_to', 'status',
  ],
  badges: [
    'badge_id', 'user_id', 'badge_type', 'earned_at',
  ],
}

/**
 * batchUpdate でシートタブを新規作成する
 * @param {string} sheetName - 作成するシート名
 * @param {string} token - OAuthアクセストークン
 */
async function createSheetTab(sheetName, token) {
  const url = `${BASE_URL}/${SPREADSHEET_ID}:batchUpdate?key=${API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    // すでに同名のシートが存在する場合は正常扱い
    if (body?.error?.message?.includes('already exists')) return
    throw new Error(`シート作成に失敗: ${res.status} ${body?.error?.message || ''}`)
  }
  console.log(`シートタブ「${sheetName}」を作成しました`)
}

/**
 * スプレッドシートを初期化する
 * - シートタブが存在しない場合は自動作成（batchUpdate）
 * - ヘッダー行が空のシートにのみ書き込む（冪等）
 */
export async function initializeSpreadsheet() {
  // OAuthトークンを localStorage から取得（sheets.js と共有）
  const token = localStorage.getItem('missionboard_token')

  for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
    try {
      const rows = await getRows(sheetName, 'A1:Z1')
      // ヘッダーが未設定の場合のみ書き込む
      if (!rows || rows.length === 0) {
        await updateRow(sheetName, 1, headers)
        console.log(`シート「${sheetName}」のヘッダーを初期化しました`)
      }
    } catch (e) {
      // 400 = シートタブが存在しない → 作成してからヘッダーを書き込む
      if (e.message.includes('400') && token) {
        try {
          await createSheetTab(sheetName, token)
          await updateRow(sheetName, 1, headers)
          console.log(`シート「${sheetName}」を新規作成・初期化しました`)
        } catch (createErr) {
          console.warn(`シート「${sheetName}」の作成に失敗:`, createErr.message)
        }
      } else {
        console.warn(`シート「${sheetName}」の初期化をスキップ:`, e.message)
      }
    }
  }
}
