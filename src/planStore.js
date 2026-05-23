// planStore.js — フリーミアムプラン管理

const PLAN_KEY        = 'revofit_plan'          // 'free' | 'premium'
const CALC_COUNT_KEY  = 'revofit_calc_count'    // 利益計算回数（累計）

export const FREE_LIMIT    = 15    // 無料プランの商品登録上限
export const PREMIUM_LIMIT = 100   // プレミアムプランの商品登録上限

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

// ── 利益計算回数カウント ────────────────────────────────
export function getCalcCount() {
  return parseInt(localStorage.getItem(CALC_COUNT_KEY) || '0', 10)
}

export function incrementCalcCount() {
  const next = getCalcCount() + 1
  localStorage.setItem(CALC_COUNT_KEY, String(next))
  return next
}

export function resetCalcCount() {
  localStorage.setItem(CALC_COUNT_KEY, '0')
}