/**
 * プッシュ通知を管理するカスタムフック
 * 通知の有効化・無効化・状態管理を行う
 */

import { useState, useEffect } from 'react'
import { isNotificationSupported, requestFcmToken, revokeFcmToken } from '../utils/notifications'
import { updateUserFcmToken } from '../api/sheets'

/**
 * @param {string} userId - 通知を管理するユーザーの ID
 */
export function useNotifications(userId) {
  const supported = isNotificationSupported()
  const [permission, setPermission] = useState(
    supported ? Notification.permission : 'denied'
  )
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // マウント時に localStorage から前回の設定を復元
  useEffect(() => {
    if (!supported) return
    const saved = localStorage.getItem(`notif_enabled_${userId}`)
    if (saved === 'true' && Notification.permission === 'granted') {
      setEnabled(true)
    }
  }, [supported, userId])

  /**
   * 通知を有効化する
   * 1. 許可ダイアログを表示
   * 2. FCM トークンを取得
   * 3. Sheets の users シートに保存
   */
  async function enable() {
    if (!supported) return
    setLoading(true)
    setError('')
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setLoading(false)
        return
      }
      const token = await requestFcmToken()
      await updateUserFcmToken(userId, token)
      setEnabled(true)
      localStorage.setItem(`notif_enabled_${userId}`, 'true')
    } catch (e) {
      setError('通知の設定に失敗しました: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 通知を無効化する
   * 1. FCM トークンを削除
   * 2. Sheets の push_endpoint を空にする
   */
  async function disable() {
    setLoading(true)
    setError('')
    try {
      await revokeFcmToken()
      await updateUserFcmToken(userId, '')
      setEnabled(false)
      localStorage.removeItem(`notif_enabled_${userId}`)
    } catch (e) {
      setError('通知の停止に失敗しました: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return { supported, permission, enabled, loading, error, enable, disable }
}
