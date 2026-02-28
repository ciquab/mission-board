/**
 * FCM バックグラウンドメッセージハンドラー
 * Service Worker として動作する（ビルドプロセス外のため import.meta.env は使えない）
 * Firebase config の値は直書きが必要
 */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

// Firebase の設定（.env の値を手動でここにも設定してください）
firebase.initializeApp({
  apiKey: "AIzaSyAlTWEeB-CS1glQcwmelJTQGCEQsXEBGJw",
  authDomain: "mission-board-ada39.firebaseapp.com",
  projectId: "mission-board-ada39",
  messagingSenderId: "742027157966",
  appId: "1:742027157966:web:38e0403fec411bb8218b9f",
})

const messaging = firebase.messaging()

// バックグラウンドでプッシュ通知を受信したときの処理
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {}
  const linkUrl = payload.fcmOptions?.link || '/mission-board/'

  self.registration.showNotification(title || 'ミッションボード', {
    body: body || 'おしらせがあるよ！',
    icon: '/mission-board/favicon.svg',
    badge: '/mission-board/favicon.svg',
    data: { url: linkUrl },
    // Android 向け振動パターン
    vibrate: [200, 100, 200],
  })
})

// 通知をタップしたときの処理
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/mission-board/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // すでにアプリが開いていればフォーカス
      for (const client of clientList) {
        if (client.url.includes('/mission-board/') && 'focus' in client) {
          return client.focus()
        }
      }
      // 開いていなければ新しいウィンドウで開く
      return clients.openWindow(targetUrl)
    })
  )
})
