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
  streak_30: {
    icon: '💎',
    label: '1かげつれんぞく',
    desc: '30日れんぞくでミッションをやりとげた！',
  },
  points_10: {
    icon: '🥉',
    label: 'ブロンズ',
    desc: 'ポイントが10ptになった！',
  },
  points_50: {
    icon: '🥈',
    label: 'シルバー',
    desc: 'ポイントが50ptになった！',
  },
  points_100: {
    icon: '🥇',
    label: 'ゴールド',
    desc: 'ポイントが100ptになった！',
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
