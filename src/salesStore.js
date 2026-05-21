// salesStore.js
// 売上履歴（実際に売れた記録）を管理する

const SALES_KEY = 'flea_market_sales'

/**
 * 売上レコードの型（参考）
 * {
 *   id: string,
 *   productId: string,     // 元の商品ID（商品管理と紐付け）
 *   productName: string,   // 商品名（スナップショット）
 *   soldDate: string,      // 売れた日付 YYYY-MM-DD
 *   platform: string,      // プラットフォーム
 *   sellPrice: number,     // 売上額
 *   buyPrice: number,      // 仕入れ値
 *   fee: number,           // 手数料
 *   shippingFee: number,   // 送料
 *   packCost: number,      // 梱包材費
 *   profit: number,        // 純利益（sellPrice - buyPrice - fee - shippingFee - packCost）
 *   createdAt: string,
 *   updatedAt: string,
 * }
 */

export function getAllSales() {
  try {
    const raw = localStorage.getItem(SALES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSale(sale) {
  const sales = getAllSales()
  const idx = sales.findIndex((s) => s.id === sale.id)

  if (idx >= 0) {
    sales[idx] = { ...sale, updatedAt: new Date().toISOString() }
  } else {
    sales.push({
      ...sale,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  localStorage.setItem(SALES_KEY, JSON.stringify(sales))
  // SummaryPage に変更を通知
  window.dispatchEvent(new CustomEvent('sales-updated'))
  return { success: true }
}

export function deleteSale(id) {
  const sales = getAllSales().filter((s) => s.id !== id)
  localStorage.setItem(SALES_KEY, JSON.stringify(sales))
  window.dispatchEvent(new CustomEvent('sales-updated'))
}

// 売上から純利益を計算
export function calcSaleProfit(sale) {
  return (
    (Number(sale.sellPrice) || 0) -
    (Number(sale.buyPrice)  || 0) -
    (Number(sale.fee)       || 0) -
    (Number(sale.shippingFee) || 0) -
    (Number(sale.packCost)  || 0)
  )
}

// 空の売上レコードを生成
export function createEmptySale(product = null) {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id:          crypto.randomUUID(),
    productId:   product?.id   || '',
    productName: product?.name || '',
    soldDate:    today,
    platform:    product?.selectedRoute?.platform || product?.platform || '',
    sellPrice:   product?.selectedRoute?.sellPrice ?? product?.sellPrice ?? '',
    buyPrice:    product?.buyPrice ?? '',
    fee:         '',
    shippingFee: product?.selectedRoute?.shippingFee ?? '',
    packCost:    product?.packCost ?? '',
    profit:      '',
  }
}

// ── 集計ユーティリティ ──────────────────────────────────

// YYYY-MM-DD → YYYY-MM
export function toMonth(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : ''
}

// YYYY-MM-DD → YYYY
export function toYear(dateStr) {
  return dateStr ? dateStr.slice(0, 4) : ''
}

// 売上リストを集計して { sellPrice, profit, fee, shippingFee, packCost, buyPrice, count } を返す
export function aggregateSales(sales) {
  return sales.reduce(
    (acc, s) => {
      acc.sellPrice   += Number(s.sellPrice)   || 0
      acc.profit      += Number(s.profit)      || 0
      acc.fee         += Number(s.fee)         || 0
      acc.shippingFee += Number(s.shippingFee) || 0
      acc.packCost    += Number(s.packCost)    || 0
      acc.buyPrice    += Number(s.buyPrice)    || 0
      acc.count       += 1
      return acc
    },
    { sellPrice: 0, profit: 0, fee: 0, shippingFee: 0, packCost: 0, buyPrice: 0, count: 0 }
  )
}

// プラットフォーム別の販売数ランキングを返す
export function platformRanking(sales) {
  const counts = {}
  for (const s of sales) {
    const pf = s.platform || '不明'
    counts[pf] = (counts[pf] || 0) + 1
  }
  return Object.entries(counts)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)
}

// 商品IDごとの累計売上数を返す
export function getSoldCountByProductId(productId) {
  return getAllSales().filter((s) => s.productId === productId).length
}