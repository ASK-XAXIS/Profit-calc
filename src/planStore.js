// planStore.js — フリーミアムプラン管理

const PLAN_KEY        = 'revofit_plan'          // 'free' | 'premium'
const DAILY_CALC_KEY  = 'revofit_daily_calc'    // { date: 'YYYY-MM-DD', count: number }

export const FREE_LIMIT       = 15   // 無料プランの商品登録上限
export const PREMIUM_LIMIT    = 100  // プレミアムプランの商品登録上限
export const FREE_CALC_LIMIT  = 10   // 無料プランの1日の計算回数上限

// ── 日本時間の今日の日付文字列を取得 (YYYY-MM-DD) ──────────
function getTodayJST() {
  const now = new Date()
  // UTC+9 に変換
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

// ── プラン取得 ──────────────────────────────────────────
export function getPlan() {
  return localStorage.getItem(PLAN_KEY) || 'free'
}

export function isPremium() {
  return getPlan() === 'premium'
}

export function getProductLimit() {
  return isPremium() ? PREMIUM_LIMIT : FREE_LIMIT
}

// ── プラン設定（購入・復元時に呼ぶ） ──────────────────────
export function setPlan(plan) {
  localStorage.setItem(PLAN_KEY, plan)
  window.dispatchEvent(new CustomEvent('plan-updated'))
}

// ── 1日のクリア回数管理 ────────────────────────────────
function getDailyCalcData() {
  try {
    const raw = localStorage.getItem(DAILY_CALC_KEY)
    if (!raw) return { date: getTodayJST(), count: 0 }
    const data = JSON.parse(raw)
    // 日付が変わっていたらリセット
    if (data.date !== getTodayJST()) {
      return { date: getTodayJST(), count: 0 }
    }
    return data
  } catch {
    return { date: getTodayJST(), count: 0 }
  }
}

// 今日のクリア回数を取得
export function getDailyCalcCount() {
  return getDailyCalcData().count
}

// クリアボタンを押したときに呼ぶ
// 戻り値: { count: number, isLimitReached: boolean, wasAlreadyLocked: boolean }
export function incrementDailyCalcCount() {
  if (isPremium()) return { count: 0, isLimitReached: false, wasAlreadyLocked: false }

  const data = getDailyCalcData()
  const wasAlreadyLocked = data.count >= FREE_CALC_LIMIT
  const next = data.count + 1
  const saved = { date: getTodayJST(), count: next }
  localStorage.setItem(DAILY_CALC_KEY, JSON.stringify(saved))

  return {
    count: next,
    isLimitReached: next >= FREE_CALC_LIMIT,
    wasAlreadyLocked,
  }
}

// 計算機が使用可能かチェック（フリーユーザーで当日10回超えたらfalse）
export function canUseCalc() {
  if (isPremium()) return true
  return getDailyCalcCount() < FREE_CALC_LIMIT
}

// 残り回数
export function getRemainingCalcCount() {
  if (isPremium()) return Infinity
  return Math.max(0, FREE_CALC_LIMIT - getDailyCalcCount())
}