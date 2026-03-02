/**
 * バッジ定義
 * badge_type → 表示情報のマッピング
 */
export const BADGE_DEFS = {
  first_mission: {
    icon: '🌟',
    label: 'はじめてのミッション',
    desc: 'はじめてミッションをクリアした！',
  },
  streak_3: {
    icon: '🔥',
    label: '3にちれんぞく',
    desc: '3日れんぞくでミッションをやりとげた！',
  },
  streak_7: {
    icon: '⚡',
    label: '1しゅうかんれんぞく',
    desc: '7日れんぞくでミッションをやりとげた！',
  },
  streak_14: {
    icon: '🧱',
    label: '2しゅうかんれんぞく',
    desc: '14日れんぞくでミッションをやりとげた！',
  },
  streak_30: {
    icon: '💎',
    label: '1かげつれんぞく',
    desc: '30日れんぞくでミッションをやりとげた！',
  },
  streak_60: {
    icon: '🌋',
    label: '2かげつれんぞく',
    desc: '60日れんぞくでミッションをやりとげた！',
  },
  streak_90: {
    icon: '🛰️',
    label: '3かげつれんぞく',
    desc: '90日れんぞくでミッションをやりとげた！',
  },
  points_10: {
    icon: '🥉',
    label: 'ブロンズ',
    desc: 'ポイントが20ptになった！',
  },
  points_50: {
    icon: '🥈',
    label: 'シルバー',
    desc: 'ポイントが80ptになった！',
  },
  points_100: {
    icon: '🥇',
    label: 'ゴールド',
    desc: 'ポイントが150ptになった！',
  },
  points_250: {
    icon: '💠',
    label: 'プラチナ',
    desc: 'ポイントが250ptになった！',
  },
  points_400: {
    icon: '👑',
    label: 'クラウン',
    desc: 'ポイントが400ptになった！',
  },
  points_600: {
    icon: '🚀',
    label: 'ロケット',
    desc: 'ポイントが600ptになった！',
  },
  points_900: {
    icon: '🌈',
    label: 'レインボー',
    desc: 'ポイントが900ptになった！',
  },
  points_1200: {
    icon: '🪐',
    label: 'ギャラクシー',
    desc: 'ポイントが1200ptになった！',
  },
  all_done: {
    icon: '🏆',
    label: 'ぜんぶクリア！',
    desc: '1日のミッションをぜんぶクリアした！',
  },
}

/**
 * badge_type からバッジ情報を取得する
 * 定義にない type は汎用情報を返す
 */
export function getBadgeDef(badgeType) {
  return BADGE_DEFS[badgeType] || { icon: '🏅', label: badgeType, desc: '' }
}
