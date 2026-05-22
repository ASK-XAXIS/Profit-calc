// productHistoryStore.js
// 商品登録完了時の履歴を保存・取得する
// 最大50件、新しい順に保持

const HISTORY_KEY  = 'product_history'
const MAX_HISTORY  = 50

export function getAllHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// 登録完了時に呼ぶ（isDraft:false で保存完了したタイミング）
export function pushHistory(product) {
  const history = getAllHistory()

  // 同名・同仕入れ値の完全重複は追加しない
  const isDup = history.some(
    (h) => h.name === product.name && h.buyPrice === product.buyPrice
  )
  if (isDup) return

  const entry = {
    id:          crypto.randomUUID(),
    savedAt:     new Date().toISOString(),
    // 履歴として保持するフィールド
    name:        product.name        || '',
    buyPrice:    product.buyPrice    ?? '',
    sellPrice:   product.sellPrice   ?? '',
    description: product.description || '',
    thickness:   product.thickness   ?? '',
    platform:    product.platform    || '',
    service:     product.service     || '',
    shipping:    product.shipping    || '',
    packCost:    product.packCost    ?? '',
    images:      product.images      || [],
  }

  // 先頭に追加、50件超えは末尾を削除
  const next = [entry, ...history].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

export function deleteHistory(id) {
  const history = getAllHistory().filter((h) => h.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}
