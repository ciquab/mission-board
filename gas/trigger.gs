/**
 * Google Apps Script: FCM 通知トリガー
 *
 * セットアップ方法:
 * 1. script.google.com で新しいプロジェクトを作成
 * 2. このコードを貼り付ける
 * 3. スクリプトプロパティに以下を設定:
 *    - SPREADSHEET_ID: スプレッドシートの ID
 *    - FIREBASE_PROJECT_ID: Firebase プロジェクト ID
 * 4. appsscript.json に oauthScopes を追加する（下記参照）
 *    {
 *      "oauthScopes": [
 *        "https://www.googleapis.com/auth/firebase.messaging",
 *        "https://www.googleapis.com/auth/spreadsheets",
 *        "https://www.googleapis.com/auth/script.external_request"
 *      ]
 *    }
 * 5. GAS エディタの「プロジェクトの設定」→「スクリプトプロパティを表示」をオンにして
 *    appsscript.json を編集後、スクリプトを一度手動実行して OAuth 権限を承認する
 * 6. checkAndSendNotifications を時間ベーストリガーで5分ごとに実行する
 * 7. generateDailyNotifications を毎日0時に実行するトリガーを設定する
 *
 * 認証方式について:
 * GAS の UrlFetchApp は jwt-bearer grant type をサポートしないため、
 * ScriptApp.getOAuthToken() でスクリプトオーナーの OAuth トークンを利用する。
 * トリガー実行時もオーナーのトークンが自動的に使われる。
 */

// ============================================================
// FCM HTTP v1 API 呼び出し
// ============================================================

/**
 * Firebase アクセストークンを取得する
 *
 * GAS の UrlFetchApp は jwt-bearer grant type が動作しないため、
 * ScriptApp.getOAuthToken() でスクリプトオーナーの OAuth トークンを返す。
 * トリガー実行時もオーナーのトークンが自動的に使われる。
 *
 * 前提: appsscript.json の oauthScopes に以下が必要
 *   "https://www.googleapis.com/auth/firebase.messaging"
 */
function getFirebaseAccessToken() {
  return ScriptApp.getOAuthToken()
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
 * Firebase アクセストークン取得の各ステップをデバッグする（手動実行用）
 * GAS エディタの「実行」→ debugFirebaseToken を選んで実行する
 */
function debugFirebaseToken() {
  const props = PropertiesService.getScriptProperties()
  const raw = props.getProperty('FIREBASE_SERVICE_ACCOUNT')

  // 1. スクリプトプロパティの存在確認
  if (!raw) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT が設定されていません')
    return
  }
  console.log('✅ FIREBASE_SERVICE_ACCOUNT は設定済み（長さ:', raw.length, '文字）')

  // 2. JSON パースの確認
  let sa
  try {
    sa = JSON.parse(raw)
  } catch (e) {
    console.error('❌ JSON.parse 失敗:', e.message)
    return
  }

  // 3. サービスアカウント JSON に必要なフィールドが揃っているか確認
  // ※ OAuth2 クライアントシークレット JSON を貼った場合は type が "authorized_user" などになる
  console.log('type:', sa.type)
  console.log('client_email:', sa.client_email)
  console.log('private_key 先頭50文字:', sa.private_key ? sa.private_key.slice(0, 50) : 'undefined')

  if (sa.type !== 'service_account') {
    console.error('❌ type が "service_account" ではありません。サービスアカウント JSON を使ってください。')
    return
  }
  if (!sa.client_email || !sa.private_key) {
    console.error('❌ client_email または private_key が存在しません')
    return
  }
  console.log('✅ JSON 構造は正常')

  // 4. ScriptApp.getOAuthToken() でトークン取得テスト
  // ※ appsscript.json に firebase.messaging スコープが追加されている必要がある
  console.log('ScriptApp.getOAuthToken() を試みています...')
  try {
    const token = ScriptApp.getOAuthToken()
    if (!token) {
      console.error('❌ トークンが空です。appsscript.json の oauthScopes を確認してください。')
      return
    }
    console.log('✅ OAuth トークン取得成功（先頭20文字）:', token.slice(0, 20))
  } catch (e) {
    console.error('❌ getOAuthToken 失敗:', e.message)
    return
  }

  // 5. 実際に FCM API を呼び出してトークンが有効か確認（存在しない FCM トークンで試す）
  console.log('FCM API への疎通確認中...')
  const projectId = PropertiesService.getScriptProperties().getProperty('FIREBASE_PROJECT_ID')
  if (!projectId) {
    console.error('❌ FIREBASE_PROJECT_ID が設定されていません')
    return
  }
  const dummyRes = UrlFetchApp.fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({ message: { token: 'dummy-token-for-auth-check' } }),
      muteHttpExceptions: true,
    }
  )
  const code = dummyRes.getResponseCode()
  const body = dummyRes.getContentText().slice(0, 300)
  console.log('FCM API レスポンスコード:', code)
  console.log('FCM API レスポンス:', body)
  // 401/403 → 認証失敗（スコープ未承認）
  // 400 → 認証は OK（ダミートークンなので "INVALID_ARGUMENT" が返るのが正常）
  if (code === 401 || code === 403) {
    console.error('❌ 認証失敗。appsscript.json のスコープ追加と再承認を行ってください。')
  } else if (code === 400) {
    console.log('✅ 認証 OK（ダミートークンで 400 が返るのは正常）')
  }
}

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
