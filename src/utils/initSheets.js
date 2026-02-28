/**
 * スプレッドシートの初期セットアップ
 * 各シートのヘッダー行が存在しない場合に書き込む
 */
import { getRows, updateRow } from '../api/sheets'

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
}

/**
 * スプレッドシートを初期化する
 * ヘッダー行が空のシートにのみ書き込みを行う（冪等）
 */
export async function initializeSpreadsheet() {
  for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
    try {
      const rows = await getRows(sheetName, 'A1:Z1')
      // ヘッダーが未設定の場合のみ書き込む
      if (!rows || rows.length === 0) {
        await updateRow(sheetName, 1, headers)
        console.log(`シート「${sheetName}」のヘッダーを初期化しました`)
      }
    } catch (e) {
      // シートが存在しない等のエラーはスキップ（GAS等で別途作成済みを前提）
      console.warn(`シート「${sheetName}」の初期化をスキップ:`, e.message)
    }
  }
}
