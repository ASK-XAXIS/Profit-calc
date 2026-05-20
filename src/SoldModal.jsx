// SoldModal.jsx
import { useState, useEffect } from 'react'
import { createEmptySale } from './salesStore'
import { feeRate as defaultFeeRate, shippingOptions } from './constants'
import { RAKUMA_FEE_OPTIONS, feeLabel } from './feeConfig.jsx'

const PLATFORM_LABEL = {
  mercari: 'メルカリ',
  yahoo:   'Yahoo!フリマ',
  rakuma:  'ラクマ',
  yahuoku: 'ヤフオク',
}
const PLATFORM_OPTIONS = Object.entries(PLATFORM_LABEL)

const ic = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"

// 純利益を計算するヘルパー
function calcProfit(sale) {
  return (
    (Number(sale.sellPrice)   || 0) -
    (Number(sale.buyPrice)    || 0) -
    (Number(sale.fee)         || 0) -
    (Number(sale.shippingFee) || 0) -
    (Number(sale.packCost)    || 0)
  )
}

// 手数料を自動計算するヘルパー
function autoFee(sellPrice, platform, feeRates) {
  const sp   = Number(sellPrice) || 0
  const rate = feeRates?.[platform] ?? defaultFeeRate[platform] ?? 0
  return sp && rate ? Math.round(sp * rate) : 0
}

export default function SoldModal({ product, feeRates, onSave, onClose }) {
  // 初期値を正しく計算した状態で作成
  const [sale, setSale] = useState(() => {
    const pf       = product?.selectedRoute?.platform || product?.platform || ''
    const sp       = product?.selectedRoute?.sellPrice ?? product?.sellPrice ?? ''
    const sf       = product?.selectedRoute?.shippingFee ?? ''
    const pc       = product?.packCost ?? ''
    const bp       = product?.buyPrice ?? ''
    const fee      = sp !== '' && pf ? autoFee(sp, pf, feeRates) : 0
    const profitVal = (Number(sp)||0) - (Number(bp)||0) - fee - (Number(sf)||0) - (Number(pc)||0)

    return {
      id:          crypto.randomUUID(),
      productId:   product?.id   || '',
      productName: product?.name || '',
      soldDate:    new Date().toISOString().slice(0, 10),
      platform:    pf,
      sellPrice:   sp !== '' ? String(sp) : '',
      buyPrice:    bp !== '' ? String(bp) : '',
      fee:         fee ? String(fee) : '',
      shippingFee: sf !== '' ? String(sf) : '',
      packCost:    pc !== '' ? String(pc) : '',
      profit:      String(profitVal),
    }
  })

  const [errors, setErrors] = useState({})

  // 純利益をリアルタイムで再計算
  function recalcProfit(next) {
    return String(calcProfit(next))
  }

  function set(key, val) {
    setSale((prev) => {
      const next = { ...prev, [key]: val }
      next.profit = recalcProfit(next)
      return next
    })
  }

  // 数値入力ハンドラ（入力途中の状態もそのまま保持）
  function numericInput(key) {
    return (e) => {
      const v = e.target.value
      if (v === '' || /^[0-9]+$/.test(v)) set(key, v)
    }
  }

  // プラットフォーム変更 → 手数料を自動更新
  function handlePlatformChange(pf) {
    setSale((prev) => {
      const fee  = autoFee(prev.sellPrice, pf, feeRates)
      const next = { ...prev, platform: pf, fee: fee ? String(fee) : '' }
      next.profit = recalcProfit(next)
      return next
    })
  }

  // 売値変更 → 手数料も自動更新
  function handleSellPriceChange(val) {
    if (val !== '' && !/^[0-9]+$/.test(val)) return
    setSale((prev) => {
      const fee  = autoFee(val, prev.platform, feeRates)
      const next = { ...prev, sellPrice: val, fee: fee ? String(fee) : '' }
      next.profit = recalcProfit(next)
      return next
    })
  }

  function validate() {
    const e = {}
    if (!sale.soldDate)        e.soldDate  = '売れた日付を入力してください'
    if (!sale.platform)        e.platform  = 'プラットフォームを選択してください'
    if (sale.sellPrice === '') e.sellPrice = '売上額を入力してください'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    onSave({
      ...sale,
      sellPrice:   Number(sale.sellPrice)   || 0,
      buyPrice:    Number(sale.buyPrice)    || 0,
      fee:         Number(sale.fee)         || 0,
      shippingFee: Number(sale.shippingFee) || 0,
      packCost:    Number(sale.packCost)    || 0,
      profit:      calcProfit(sale),
    })
  }

  const profitNum   = calcProfit(sale)
  const profitColor = profitNum > 0 ? 'text-emerald-600' : profitNum < 0 ? 'text-red-500' : 'text-gray-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        <div className="bg-emerald-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">売れた！登録</h2>
            <p className="text-emerald-100 text-xs mt-0.5 truncate">{product?.name}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 max-h-[72vh] overflow-y-auto space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">売れた日付 <span className="text-red-400">*</span></label>
            <input type="date" value={sale.soldDate} onChange={(e) => set('soldDate', e.target.value)} className={ic} />
            {errors.soldDate && <p className="text-xs text-red-500 mt-1">{errors.soldDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">プラットフォーム <span className="text-red-400">*</span></label>
            <select value={sale.platform} onChange={(e) => handlePlatformChange(e.target.value)} className={ic}>
              <option value="">選択してください</option>
              {PLATFORM_OPTIONS.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {errors.platform && <p className="text-xs text-red-500 mt-1">{errors.platform}</p>}
          </div>

          {/* ラクマ選択時：手数料率セレクト */}
          {sale.platform === 'rakuma' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ラクマ手数料率</label>
              <select
                value={feeRates?.rakuma ?? 0.10}
                onChange={(e) => {
                  // feeRatesを更新してfeeも再計算
                  const newRate = Number(e.target.value)
                  const newFeeRates = { ...feeRates, rakuma: newRate }
                  setSale((prev) => {
                    const fee = prev.sellPrice ? String(Math.round(Number(prev.sellPrice) * newRate)) : ''
                    const next = { ...prev, fee }
                    next.profit = recalcProfit(next)
                    return next
                  })
                  // 親へも通知（App全体に反映）
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('rakuma-fee-change', { detail: newRate }))
                  }
                }}
                className={ic}
              >
                {RAKUMA_FEE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">全領域に即時反映されます</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">売上額（円） <span className="text-red-400">*</span></label>
            <input type="text" inputMode="numeric" value={sale.sellPrice}
              onChange={(e) => handleSellPriceChange(e.target.value)} placeholder="例：3000" className={ic} />
            {errors.sellPrice && <p className="text-xs text-red-500 mt-1">{errors.sellPrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">仕入れ値（円）</label>
            <input type="text" inputMode="numeric" value={sale.buyPrice}
              onChange={numericInput('buyPrice')} placeholder="例：1000" className={ic} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">手数料（円）
              <span className="ml-2 text-[10px] text-gray-400 font-normal">プラットフォーム・売上額から自動計算</span>
            </label>
            <input type="text" inputMode="numeric" value={sale.fee}
              onChange={numericInput('fee')} placeholder="例：300" className={ic} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">送料（円）</label>
            <input type="text" inputMode="numeric" value={sale.shippingFee}
              onChange={numericInput('shippingFee')} placeholder="例：210" className={ic} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">梱包材費（円）</label>
            <input type="text" inputMode="numeric" value={sale.packCost}
              onChange={numericInput('packCost')} placeholder="例：50" className={ic} />
          </div>

          {/* 純利益プレビュー（リアルタイム） */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">純利益（自動計算）</span>
              <span className={`text-xl font-black ${profitColor}`}>
                {profitNum > 0 ? '+' : ''}{profitNum.toLocaleString()}円
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-400">
              <span>売上 ¥{Number(sale.sellPrice)||0}</span>
              <span>仕入 ¥{Number(sale.buyPrice)||0}</span>
              <span>手数料 ¥{Number(sale.fee)||0}</span>
              <span>送料 ¥{Number(sale.shippingFee)||0}</span>
              <span>梱包 ¥{Number(sale.packCost)||0}</span>
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
