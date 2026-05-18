// priceSearchAdapter.js
// ──────────────────────────────────────────────────────────────────
// 相場検索の「差し替え口（アダプター）」
//
// 現状：各プラットフォームの検索URLを生成してブラウザで開く
// 将来：fetchMarketPrice() の中身を API 呼び出しに差し替えるだけで
//       自動取得に切り替えられる設計になっています。
// ──────────────────────────────────────────────────────────────────

/**
 * 各プラットフォームの検索URLを生成する
 * @param {string} productName - 商品名
 * @param {string} platform - 'mercari' | 'yahoo' | 'rakuma'
 * @returns {string} 検索URL
 */
export function getSearchUrl(productName, platform) {
  const encoded = encodeURIComponent(productName)
  switch (platform) {
    case 'mercari':
      return `https://jp.mercari.com/search?keyword=${encoded}&status=sold_out`
    case 'yahoo':
      return `https://paypayfleamarket.yahoo.co.jp/search/${encoded}`
    case 'rakuma':
      return `https://fril.jp/search?query=${encoded}`
    default:
      return `https://www.google.com/search?q=${encoded}+フリマ+相場`
  }
}

/**
 * 相場価格を自動取得する（将来の API 差し替え用）
 *
 * ◆ 現状
 *   null を返す → UI 側で「検索リンク」表示にフォールバックする
 *
 * ◆ 将来の差し替え例（Mercari API など）
 *   const res = await fetch(`/api/market-price?q=${name}&platform=${platform}`)
 *   const data = await res.json()
 *   return data.averagePrice  // number を返す
 *
 * @param {string} productName
 * @param {string} platform
 * @returns {Promise<number|null>}
 */
export async function fetchMarketPrice(productName, platform) {
  // TODO: API が使えるようになったらここを実装する
  // eslint-disable-next-line no-unused-vars
  void productName
  void platform
  return null
}
