// simulationEngine.js
// プラットフォーム×発送方法の全組み合わせで損益を計算する

import { feeRate, shippingOptions } from './constants'
import { calcFee, calcProfit } from './calc'

// 厚みcmから各プラットフォームで利用可能な発送方法を絞り込む
// shippingOptions の option.maxThickness フィールドで判定する
// ※ constants.js の option に maxThickness を付与している前提
//   付与されていない場合は全件対象とする
function filterOptionsByThickness(options, thicknessCm) {
  const t = parseFloat(thicknessCm)
  if (isNaN(t) || t <= 0) return options // 厚み未入力 → 全件表示
  return options.filter((o) =>
    o.maxThickness === undefined || o.maxThickness === null || t <= o.maxThickness
  )
}

/**
 * プラットフォーム×発送方法の全組み合わせで損益を計算して返す
 *
 * @param {object} params
 * @param {number|string} params.sellPriceOverrides  - { mercari: 1500, yahoo: 1500, rakuma: 1500 } 上書き売値
 * @param {number|string} params.buyPrice
 * @param {number|string} params.packCost
 * @param {number|string} params.thickness
 * @returns {SimRow[]}  - 全組み合わせの計算結果配列
 */
export function buildSimulation({ sellPriceOverrides, buyPrice, packCost, thickness }) {
  const rows = []

  for (const [platformKey, services] of Object.entries(shippingOptions)) {
    const rate = feeRate[platformKey]
    const sellPrice = Number(sellPriceOverrides[platformKey]) || 0

    for (const serviceObj of services) {
      const filteredOptions = filterOptionsByThickness(serviceObj.options, thickness)

      for (const option of filteredOptions) {
        const fee = calcFee(sellPrice, rate)
        const profit = calcProfit(
          sellPrice,
          Number(buyPrice) || 0,
          fee,
          option.fee,
          Number(packCost) || 0
        )

        rows.push({
          platform: platformKey,
          service: serviceObj.service,
          serviceLabel: serviceObj.label,
          shippingValue: option.value,
          shippingLabel: option.label,
          shippingFee: option.fee,
          sellPrice,
          fee: Math.round(fee),
          profit: Math.round(profit),
        })
      }
    }
  }

  return rows
}

/**
 * rows の中から最大利益の行を返す
 */
export function findBestRow(rows) {
  if (rows.length === 0) return null
  return rows.reduce((best, row) => (row.profit > best.profit ? row : best), rows[0])
}
