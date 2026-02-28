/**
 * Firebase Cloud Messaging（FCM）ユーティリティ
 * FCM トークンの取得・削除・通知許可の管理を担う
 */

import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, deleteToken } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let messagingInstance = null

/**
 * Firebase Messaging のインスタンスを取得（シングルトン）
 */
function getFirebaseMessaging() {
  if (messagingInstance) return messagingInstance

  // 既に初期化済みの場合は既存のアプリを使う
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
  messagingInstance = getMessaging(app)
  return messagingInstance
}

/**
 * ブラウザが通知・Service Worker・Push API をサポートしているか確認
 */
export function isNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

/**
 * FCM トークンを取得する
 * - 通知許可が必要（呼び出し前に Notification.requestPermission() を行うこと）
 * - firebase-messaging-sw.js を Service Worker として登録する
 * @returns {Promise<string>} FCM デバイストークン
 */
export async function requestFcmToken() {
  const messaging = getFirebaseMessaging()

  // firebase-messaging-sw.js を明示的に登録（base が /mission-board/ のためスコープを指定）
  const registration = await navigator.serviceWorker.register(
    '/mission-board/firebase-messaging-sw.js',
    { scope: '/mission-board/' }
  )

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })

  if (!token) throw new Error('FCM トークンの取得に失敗しました。')
  return token
}

/**
 * FCM トークンを削除する（通知停止時に呼ぶ）
 */
export async function revokeFcmToken() {
  try {
    const messaging = getFirebaseMessaging()
    await deleteToken(messaging)
  } catch (e) {
    // トークンが存在しない場合も正常終了扱いにする
    console.warn('FCM トークンの削除:', e.message)
  }
}
