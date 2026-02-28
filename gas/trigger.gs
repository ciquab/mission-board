/**
 * Google Apps Script: FCM 通知トリガー
 *
 * セットアップ方法:
 * 1. script.google.com で新しいプロジェクトを作成
 * 2. このコードを貼り付ける
 * 3. スクリプトプロパティに以下を設定:
 *    - SPREADSHEET_ID: スプレッドシートの ID
 *    - FIREBASE_PROJECT_ID: Firebase プロジェクト ID
 *    - FIREBASE_SERVICE_ACCOUNT: サービスアカウント JSON 全体の文字列
 * 4. checkAndSendNotifications を時間ベーストリガーで5分ごとに実行する
 * 5. generateDailyNotifications を毎日0時に実行するトリガーを設定する
 */

// ============================================================
// FCM HTTP v1 API 呼び出し
// ============================================================

/**
 * サービスアカウントの秘密鍵から Firebase アクセストークンを取得する
 * GAS の Utilities.computeRsaSha256Signature で JWT 署名する
 */
function getFirebaseAccessToken() {
  const props = PropertiesService.getScriptProperties()
  const sa = JSON.parse(props.getProperty('FIREBASE_SERVICE_ACCOUNT'))

  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64UrlEncode(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const sigInput = `${header}.${claim}`
  const sigBytes = Utilities.computeRsaSha256Signature(sigInput, sa.private_key)
  const sig = Utilities.base64EncodeWebSafe(sigBytes).replace(/=+$/, '')
  const jwt = `${sigInput}.${sig}`

  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    payload: `grant_type=urn%3Aietf%3Aparams%3Aoauth2%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    muteHttpExceptions: true,
  })

  const data = JSON.parse(res.getContentText())
  if (!data.access_token) {
    throw new Error('アクセストークン取得失敗: ' + res.getContentText())
  }
  return data.access_token
}

/**
 * 文字列を Base64URL エンコードする（JWT 用）
 */
function base64UrlEncode(str) {
  return Utilities.base64EncodeWebSafe(str).replace(/=+$/, '')
}

/**
 * FCM HTTP v1 API でプッシュ通知を送信する
 * @param {string} fcmToken - 送信先デバイスの FCM トークン
 * @param {string} title - 通知タイトル
 * @param {string} body - 通知本文
 * @param {string} linkUrl - 通知タップ時の遷移先 URL
 * @returns {boolean} 送信成功かどうか
 */
function sendFcmNotification(fcmToken, title, body, linkUrl) {
  const props = PropertiesService.getScriptProperties()
  const projectId = props.getProperty('FIREBASE_PROJECT_ID')
  const appUrl = 'https://ciquab.github.io/mission-board/'

  let accessToken
  try {
    accessToken = getFirebaseAccessToken()
  } catch (e) {
    console.error('Firebase トークン取得エラー:', e.message)
    return false
  }

  const payload = {
    message: {
      token: fcmToken,
      notification: { title, body },
      webpush: {
        notification: {
          icon: appUrl + 'favicon.svg',
          badge: appUrl + 'favicon.svg',
        },
        fcm_options: {
          link: linkUrl || appUrl,
        },
      },
    },
  }

  try {
    const res = UrlFetchApp.fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      }
    )
    const code = res.getResponseCode()
    if (code >= 200 && code < 300) return true

    console.error('FCM 送信失敗:', code, res.getContentText())
    return false
  } catch (e) {
    console.error('FCM 送信例外:', e.message)
    return false
  }
}

// ============================================================
// メイン処理
// ============================================================

/**
 * 通知チェックと送信
 * 5分ごとに実行するトリガーを設定する
 */
function checkAndSendNotifications() {
  const props = PropertiesService.getScriptProperties()
  const spreadsheetId = props.getProperty('SPREADSHEET_ID')
  const ss = SpreadsheetApp.openById(spreadsheetId)
  const notifSheet = ss.getSheetByName('notifications')
  const usersSheet = ss.getSheetByName('users')

  const notifRows = notifSheet.getDataRange().getValues()
  const userRows = usersSheet.getDataRange().getValues()
  const now = new Date()

  notifRows.slice(1).forEach((row, i) => {
    const [id, taskId, userId, type, scheduledAt, sent] = row

    // 送信済みはスキップ
    if (sent === true || sent === 'TRUE' || sent === true) return

    // 時刻が来ていないものはスキップ
    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate > now) return

    // users シートから FCM トークン（push_endpoint カラム）を取得
    const userRow = userRows.find(r => r[0] === userId)
    if (!userRow || !userRow[5]) {
      // FCM トークンが未登録でも送信済みフラグを立てる（再試行しない）
      notifSheet.getRange(i + 2, 6).setValue(true)
      notifSheet.getRange(i + 2, 7).setValue(new Date().toISOString())
      return
    }

    const fcmToken = userRow[5]
    const { title, body } = buildMessage(type, taskId)
    const success = sendFcmNotification(fcmToken, title, body, '')

    if (success) {
      notifSheet.getRange(i + 2, 6).setValue(true)
      notifSheet.getRange(i + 2, 7).setValue(new Date().toISOString())
    }
  })
}

/**
 * 通知タイプに応じたメッセージを生成する
 */
function buildMessage(type, taskId) {
  const messages = {
    reminder:  { title: 'ミッションボード ⏰', body: 'そろそろじかんだよ！ミッションをかくにんしよう！' },
    followup:  { title: 'ミッションボード 📣', body: 'まだおわってないミッションがあるよ！' },
    approval:  { title: 'ミッションボード ✅', body: 'こどもがタスクをかんりょうしたよ！かくにんしてね。' },
    proposal:  { title: 'ミッションボード 💡', body: 'こどもからミッションのていあんがとどいたよ！' },
    result:    { title: 'ミッションボード 🎉', body: 'ていあんのけっかがとどいたよ！かくにんしよう！' },
    summary:   { title: 'ミッションボード 📊', body: 'きょうのミッションのまとめだよ！おつかれさま！' },
    streak:    { title: 'ミッションボード 🔥', body: 'れんぞくたっせいおめでとう！すごいね！' },
  }
  return messages[type] || { title: 'ミッションボード', body: 'おしらせがあるよ！' }
}

/**
 * 毎日ルーティンタスクの通知スケジュールを生成する
 * 毎日0時に実行するトリガーを設定する
 */
function generateDailyNotifications() {
  const props = PropertiesService.getScriptProperties()
  const spreadsheetId = props.getProperty('SPREADSHEET_ID')
  const ss = SpreadsheetApp.openById(spreadsheetId)
  const tasksSheet = ss.getSheetByName('tasks')
  const notifSheet = ss.getSheetByName('notifications')
  const tasks = tasksSheet.getDataRange().getValues()

  const today = new Date()

  // 時間帯ごとの通知時刻（各時間帯の15分前）
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
    if (recurrence !== 'daily') return

    const timeStr = timeBlocks[timeBlock]
    if (!timeStr) return

    const [h, m] = timeStr.split(':').map(Number)
    const scheduledAt = new Date(today)
    scheduledAt.setHours(h, m - 15, 0, 0) // 15分前に通知

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

// ============================================================
// テスト用関数
// ============================================================

/**
 * 特定の FCM トークンにテスト通知を送信する（GAS エディタから手動実行）
 * 実行前に引数を変更してください
 */
function testSendNotification() {
  const testToken = 'YOUR_FCM_TOKEN_HERE'
  const success = sendFcmNotification(
    testToken,
    'テスト通知 🔔',
    'ミッションボードからのテストメッセージです！',
    ''
  )
  console.log('送信結果:', success ? '成功' : '失敗')
}
