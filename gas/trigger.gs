/**
 * Google Apps Script: 通知トリガー
 * 
 * セットアップ方法:
 * 1. script.google.com で新しいプロジェクトを作成
 * 2. このコードを貼り付ける
 * 3. SPREADSHEET_ID と VAPID_PRIVATE_KEY を設定する
 * 4. checkAndSendNotifications を時間ベーストリガーで5分ごとに実行する
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'

/**
 * メイン関数: 通知チェックと送信
 * 5分ごとに実行するトリガーを設定する
 */
function checkAndSendNotifications() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  const notifSheet = ss.getSheetByName('notifications')
  const rows = notifSheet.getDataRange().getValues()

  const now = new Date()

  rows.slice(1).forEach((row, i) => {
    const [id, taskId, userId, type, scheduledAt, sent] = row
    if (sent === true || sent === 'TRUE') return

    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= now) {
      // 通知を送信する
      const success = sendPushNotification(userId, type, taskId)
      if (success) {
        // sentフラグを更新
        notifSheet.getRange(i + 2, 6).setValue(true)
        notifSheet.getRange(i + 2, 7).setValue(new Date().toISOString())
      }
    }
  })
}

/**
 * プッシュ通知を送信する
 * TODO: Web Push ライブラリを使って実装する
 */
function sendPushNotification(userId, type, taskId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  const usersSheet = ss.getSheetByName('users')
  const users = usersSheet.getDataRange().getValues()

  // ユーザーのpush_endpointを取得
  const userRow = users.find(row => row[0] === userId)
  if (!userRow || !userRow[5]) return false // push_endpoint なし

  const pushEndpoint = userRow[5]
  const message = buildMessage(type, taskId)

  // Web Push API への送信
  // 実際の実装はVAPIDキーを使ったJWT署名が必要
  // 参考: https://web.dev/push-notifications-server-codelab/
  try {
    const response = UrlFetchApp.fetch(pushEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'vapid ...' // VAPID JWT をここに設定
      },
      payload: JSON.stringify(message),
      muteHttpExceptions: true,
    })
    return response.getResponseCode() < 300
  } catch (e) {
    console.error('通知送信エラー:', e)
    return false
  }
}

/**
 * 通知タイプに応じたメッセージを生成する
 */
function buildMessage(type, taskId) {
  const messages = {
    reminder: { title: 'ミッションボード ⏰', body: 'そろそろじかんだよ！ミッションをかくにんしよう！' },
    followup: { title: 'ミッションボード 📣', body: 'まだおわってないミッションがあるよ！' },
    approval: { title: 'ミッションボード ✅', body: 'こどもがタスクをかんりょうしたよ！かくにんしてね。' },
    proposal: { title: 'ミッションボード 💡', body: 'こどもからミッションのていあんがとどいたよ！' },
    result:   { title: 'ミッションボード 🎉', body: 'ていあんのけっかがとどいたよ！かくにんしよう！' },
    summary:  { title: 'ミッションボード 📊', body: 'きょうのミッションのまとめだよ！おつかれさま！' },
    streak:   { title: 'ミッションボード 🔥', body: 'れんぞくたっせいおめでとう！すごいね！' },
  }
  return messages[type] || { title: 'ミッションボード', body: 'おしらせがあるよ！' }
}

/**
 * 毎日ルーティンタスクの通知スケジュールを生成する
 * 毎日0時に実行するトリガーを設定する
 */
function generateDailyNotifications() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  const tasksSheet = ss.getSheetByName('tasks')
  const notifSheet = ss.getSheetByName('notifications')
  const tasks = tasksSheet.getDataRange().getValues()

  const today = new Date()
  const dayOfWeek = today.getDay() // 0=日, 1=月, ..., 6=土

  const timeBlocks = {
    morning:   '07:30',
    afternoon: '15:00',
    evening:   '17:00',
    night:     '19:00',
    bedtime:   '21:00',
  }

  tasks.slice(1).forEach(row => {
    const [taskId, , , type, recurrence, timeBlock, assignedTo, , , approvalStatus, , , , , status] = row
    if (status !== 'active' || approvalStatus === 'pending') return
    if (type !== 'routine') return

    // 今日が対象の曜日か判定（weeklyの場合）
    // 簡易実装: dailyは毎日、それ以外はスキップ
    if (recurrence !== 'daily') return

    const timeStr = timeBlocks[timeBlock]
    if (!timeStr) return

    const [h, m] = timeStr.split(':').map(Number)
    const scheduledAt = new Date(today)
    scheduledAt.setHours(h - 0, m - 15, 0, 0) // 15分前に通知

    notifSheet.appendRow([
      `notif_${Date.now()}_${taskId}`,
      taskId,
      assignedTo,
      'reminder',
      scheduledAt.toISOString(),
      false,
      '',
    ])
  })
}
