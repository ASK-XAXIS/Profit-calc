// simulationEngine.js
import { feeRate as defaultFeeRate, shippingOptions } from './constants'
import { calcFee, calcProfit } from './calc'

function filterOptionsByThickness(options, thicknessCm) {
  const t = parseFloat(thicknessCm)
  if (isNaN(t) || t <= 0) return options
  return options.filter((o) =>
    o.maxThickness === undefined || o.maxThickness === null || t <= o.maxThickness
  )
}

/**
 * @param {object} params
 * @param {object} params.sellPriceOverrides - { mercari, yahoo, rakuma, yahuoku } 上書き売値
 * @param {number|string} params.buyPrice
 * @param {number|string} params.packCost
 * @param {number|string} params.thickness
 * @param {object} [params.feeRates] - { mercari, yahoo, rakuma, yahuoku } 上書き手数料率（省略時はdefault）
 */
export function buildSimulation({ sellPriceOverrides, buyPrice, packCost, thickness, feeRates }) {
  // デフォルト手数料率に上書き分をマージ
  const rates = { ...defaultFeeRate, ...(feeRates || {}) }
  const rows = []

  for (const [platformKey, services] of Object.entries(shippingOptions)) {
    const rate      = rates[platformKey]
    const sellPrice = Number(sellPriceOverrides[platformKey]) || 0

    for (const serviceObj of services) {
      // 匿名配送以外はシミュレーション対象外
      if (serviceObj.anonymous === false) continue

      const filteredOptions = filterOptionsByThickness(serviceObj.options, thickness)

      for (const option of filteredOptions) {
        const fee    = calcFee(sellPrice, rate)
        const profit = calcProfit(
          sellPrice,
          Number(buyPrice) || 0,
          fee,
          option.fee,
          Number(packCost) || 0
        )

        rows.push({
          platform:      platformKey,
          service:       serviceObj.service,
          serviceLabel:  serviceObj.label,
          shippingValue: option.value,
          shippingLabel: option.label,
          shippingFee:   option.fee,
          sellPrice,
          fee:    Math.round(fee),
          profit: Math.round(profit),
        })
      }
    }
  }

  return rows
}

export function findBestRow(rows) {
  if (rows.length === 0) return null
  return rows.reduce((best, row) => (row.profit > best.profit ? row : best), rows[0])
}
