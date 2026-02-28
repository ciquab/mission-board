/**
 * canvas-confetti ラッパー
 * タスク完了時・全ミッション完了時のアニメーション
 */
import confetti from 'canvas-confetti'

const COLORS = ['#2E75B6', '#FFB300', '#4CAF50', '#FF6B35', '#9C27B0', '#F44336']

/** 1タスク完了時の紙吹雪 */
export function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.65 },
    colors: COLORS,
    ticks: 200,
  })
}

/** 全ミッション完了時の連続紙吹雪（両端から2秒間） */
export function fireAllDoneConfetti() {
  const end = Date.now() + 2000
  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: COLORS,
    })
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: COLORS,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
