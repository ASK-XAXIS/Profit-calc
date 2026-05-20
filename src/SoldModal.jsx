// SoldModal.jsx
// 商品管理の「売れた！」ボタンから呼ばれる
// 不足情報を入力して売上を登録し、在庫を1つ減らす

import { useState } from 'react'
import { createEmptySale, calcSaleProfit } from './salesStore'
import { feeRate as defaultFeeRate, shippingOptions } from './constants'
import { RAKUMA_FEE_OPTIONS, feeLabel } from './feeConfig.jsx'

const PLATFORM_LABEL = {
  mercari: 'メルカリ',
  yahoo:   'Yahoo!フリマ',
  rakuma:  'ラクマ',
  yahuoku: 'ヤフオク',
}
const PLATFORM_OPTIONS = Object.entries(PLATFORM_LABEL)

function FieldRow({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

const ic = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"

export default function SoldModal({ product, feeRates, onSave, onClose }) {
  const [sale, setSale] = useState(() => {
    const base = createEmptySale(product)
    // 売値が販売ルートにあればそれを使う
    const sp = product?.selectedRoute?.sellPrice ?? product?.sellPrice ?? ''
    // 送料
    const sf = product?.selectedRoute?.shippingFee ?? ''
    // 手数料を自動計算
    const pf = product?.selectedRoute?.platform || product?.platform || ''
    const rate = feeRates?.[pf] ?? defaultFeeRate[pf] ?? 0
    const fee = sp !== '' && rate ? Math.round(Number(sp) * rate) : ''
    return {
      ...base,
      sellPrice:   sp !== '' ? String(sp) : '',
      fee:         fee !== '' ? String(fee) : '',
      shippingFee: sf !== '' ? String(sf) : '',
      packCost:    product?.packCost !== '' ? String(product?.packCost ?? '') : '',
    }
  })

  const [errors, setErrors] = useState({})

  function set(key, val) {
    setSale((prev) => {
      const next = { ...prev, [key]: val }
      // sellPrice か fee か platform が変わったら profit を再計算
      const sp  = Number(next.sellPrice)   || 0
      const bp  = Number(next.buyPrice)    || 0
      const fe  = Number(next.fee)         || 0
      const sf  = Number(next.shippingFee) || 0
      const pc  = Number(next.packCost)    || 0
      next.profit = String(sp - bp - fe - sf - pc)
      return next
    })
  }

  // プラットフォーム変更時に手数料を自動更新
  function handlePlatformChange(pf) {
    const rate = feeRates?.[pf] ?? defaultFeeRate[pf] ?? 0
    const sp = Number(sale.sellPrice) || 0
    const fee = sp && rate ? String(Math.round(sp * rate)) : ''
    setSale((prev) => {
      const next = { ...prev, platform: pf, fee }
      const bp = Number(next.buyPrice) || 0
      const sf = Number(next.shippingFee) || 0
      const pc = Number(next.packCost) || 0
      next.profit = String(sp - bp - Number(fee || 0) - sf - pc)
      return next
    })
  }

  // 売値変更時に手数料を自動更新
  function handleSellPriceChange(val) {
    if (val !== '' && !/^[0-9]+$/.test(val)) return
    const sp = Number(val) || 0
    const pf = sale.platform
    const rate = feeRates?.[pf] ?? defaultFeeRate[pf] ?? 0
    const fee = sp && rate ? String(Math.round(sp * rate)) : sale.fee
    setSale((prev) => {
      const next = { ...prev, sellPrice: val, fee }
      const bp = Number(next.buyPrice) || 0
      const sf = Number(next.shippingFee) || 0
      const pc = Number(next.packCost) || 0
      next.profit = String(sp - bp - Number(fee || 0) - sf - pc)
      return next
    })
  }

  function numericInput(key) {
    return (e) => {
      const v = e.target.value
      if (v === '' || /^[0-9]+$/.test(v)) set(key, v)
    }
  }

  function validate() {
    const e = {}
    if (!sale.soldDate)             e.soldDate   = '売れた日付を入力してください'
    if (!sale.platform)             e.platform   = 'プラットフォームを選択してください'
    if (sale.sellPrice === '')      e.sellPrice  = '売上額を入力してください'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    const finalSale = {
      ...sale,
      sellPrice:   Number(sale.sellPrice)   || 0,
      buyPrice:    Number(sale.buyPrice)    || 0,
      fee:         Number(sale.fee)         || 0,
      shippingFee: Number(sale.shippingFee) || 0,
      packCost:    Number(sale.packCost)    || 0,
      profit:      Number(sale.profit)      || 0,
    }
    onSave(finalSale)
  }

  const profitNum = Number(sale.profit) || 0
  const profitColor = profitNum > 0 ? 'text-emerald-600' : profitNum < 0 ? 'text-red-500' : 'text-gray-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ヘッダー */}
        <div className="bg-emerald-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">売れた！登録</h2>
            <p className="text-emerald-100 text-xs mt-0.5 truncate">{product?.name}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 max-h-[72vh] overflow-y-auto space-y-4">

          {/* 売れた日付 */}
          <FieldRow label="売れた日付" required>
            <input type="date" value={sale.soldDate}
              onChange={(e) => set('soldDate', e.target.value)} className={ic} />
            {errors.soldDate && <p className="text-xs text-red-500 mt-1">{errors.soldDate}</p>}
          </FieldRow>

          {/* プラットフォーム */}
          <FieldRow label="プラットフォーム" required>
            <select value={sale.platform} onChange={(e) => handlePlatformChange(e.target.value)} className={ic}>
              <option value="">選択してください</option>
              {PLATFORM_OPTIONS.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {errors.platform && <p className="text-xs text-red-500 mt-1">{errors.platform}</p>}
          </FieldRow>

          {/* 売上額 */}
          <FieldRow label="売上額（円）" required>
            <input type="text" inputMode="numeric" value={sale.sellPrice}
              onChange={(e) => handleSellPriceChange(e.target.value)}
              placeholder="例：3000" className={ic} />
            {errors.sellPrice && <p className="text-xs text-red-500 mt-1">{errors.sellPrice}</p>}
          </FieldRow>

          {/* 仕入れ値 */}
          <FieldRow label="仕入れ値（円）" hint="商品情報から自動入力">
            <input type="text" inputMode="numeric" value={sale.buyPrice}
              onChange={numericInput('buyPrice')} placeholder="例：1000" className={ic} />
          </FieldRow>

          {/* 手数料 */}
          <FieldRow label="手数料（円）" hint="プラットフォーム・売上額から自動計算">
            <input type="text" inputMode="numeric" value={sale.fee}
              onChange={numericInput('fee')} placeholder="例：300" className={ic} />
          </FieldRow>

          {/* 送料 */}
          <FieldRow label="送料（円）" hint="販売ルートから自動入力">
            <input type="text" inputMode="numeric" value={sale.shippingFee}
              onChange={numericInput('shippingFee')} placeholder="例：210" className={ic} />
          </FieldRow>

          {/* 梱包材費 */}
          <FieldRow label="梱包材費（円）" hint="商品情報から自動入力">
            <input type="text" inputMode="numeric" value={sale.packCost}
              onChange={numericInput('packCost')} placeholder="例：50" className={ic} />
          </FieldRow>

          {/* 純利益プレビュー */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">純利益（自動計算）</span>
              <span className={`text-xl font-black ${profitColor}`}>
                {profitNum > 0 ? '+' : ''}{profitNum.toLocaleString()}円
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-5 py-2 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition">キャンセル</button>
          <button onClick={handleSave} className="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition">
            売上を登録する
          </button>
        </div>
      </div>
    </div>
  )
}