// SummaryPage.jsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  getAllSales, saveSale, deleteSale, createEmptySale,
  aggregateSales, platformRanking, toMonth, toYear,
} from './salesStore'
import { feeRate as defaultFeeRate } from './constants'
import { RAKUMA_FEE_OPTIONS, feeLabel } from './feeConfig.jsx'

const PLATFORM_LABEL = {
  mercari: 'メルカリ',
  yahoo:   'Yahoo!フリマ',
  rakuma:  'ラクマ',
  yahuoku: 'ヤフオク',
  '不明':  '不明',
}
const PLATFORM_COLOR = {
  mercari: '#ef4444',
  yahoo:   '#a855f7',
  rakuma:  '#1e3a8a',
  yahuoku: '#f97316',
  '不明':  '#9ca3af',
}
const PLATFORM_OPTIONS = [
  { value: 'mercari', label: 'メルカリ' },
  { value: 'yahoo',   label: 'Yahoo!フリマ' },
  { value: 'rakuma',  label: 'ラクマ' },
  { value: 'yahuoku', label: 'ヤフオク' },
]

const ic = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"

// 純利益を計算
function calcSaleProfit(s) {
  return (
    (Number(s.sellPrice)   || 0) -
    (Number(s.buyPrice)    || 0) -
    (Number(s.fee)         || 0) -
    (Number(s.shippingFee) || 0) -
    (Number(s.packCost)    || 0)
  )
}

// 手数料自動計算
function autoFee(sellPrice, platform, feeRates) {
  const sp   = Number(sellPrice) || 0
  const rate = feeRates?.[platform] ?? defaultFeeRate[platform] ?? 0
  return sp && rate ? Math.round(sp * rate) : 0
}

// ── ミニ円グラフ ──────────────────────────────────────────
function PieChart({ data, size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="text-xs text-gray-400 text-center py-4">データなし</div>

  let cumAngle = -Math.PI / 2
  const cx = size / 2, cy = size / 2, r = size / 2 - 4

  const paths = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(cumAngle)
    const y1 = cy + r * Math.sin(cumAngle)
    cumAngle += angle
    const x2 = cx + r * Math.cos(cumAngle)
    const y2 = cy + r * Math.sin(cumAngle)
    const large = angle > Math.PI ? 1 : 0
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} Z`, color: d.color }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} opacity={0.9} />)}
    </svg>
  )
}

// ── 集計カード ─────────────────────────────────────────────
function SummaryCard({ label, value, color = 'text-gray-800', prefix = '¥', suffix = '円' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-3">
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      <p className={`text-base font-black leading-none ${color}`}>
        {prefix}{Number(value).toLocaleString()}
        <span className="text-xs font-normal ml-0.5">{suffix}</span>
      </p>
    </div>
  )
}

// ── 純利益プレビューバー ──────────────────────────────────
function ProfitPreview({ s }) {
  const profit = calcSaleProfit(s)
  const color  = profit > 0 ? 'text-emerald-600' : profit < 0 ? 'text-red-500' : 'text-gray-400'
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">純利益（自動計算）</span>
        <span className={`text-xl font-black ${color}`}>
          {profit > 0 ? '+' : ''}{profit.toLocaleString()}円
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-400">
        <span>売上 ¥{Number(s.sellPrice)||0}</span>
        <span>仕入 ¥{Number(s.buyPrice)||0}</span>
        <span>手数料 ¥{Number(s.fee)||0}</span>
        <span>送料 ¥{Number(s.shippingFee)||0}</span>
        <span>梱包 ¥{Number(s.packCost)||0}</span>
      </div>
    </div>
  )
}

// ── 売上編集モーダル ──────────────────────────────────────
function SaleEditModal({ sale: initial, feeRates, onSave, onDelete, onClose }) {
  const [s, setS] = useState({
    ...initial,
    sellPrice:   String(initial.sellPrice   ?? ''),
    buyPrice:    String(initial.buyPrice    ?? ''),
    fee:         String(initial.fee         ?? ''),
    shippingFee: String(initial.shippingFee ?? ''),
    packCost:    String(initial.packCost    ?? ''),
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  function set(key, val) {
    setS((prev) => ({ ...prev, [key]: val }))
  }

  function numericInput(key) {
    return (e) => {
      const v = e.target.value
      if (v === '' || /^[0-9]+$/.test(v)) set(key, v)
    }
  }

  function handlePlatformChange(pf) {
    setS((prev) => {
      const fee = autoFee(prev.sellPrice, pf, feeRates)
      return { ...prev, platform: pf, fee: fee ? String(fee) : prev.fee }
    })
  }

  function handleSave() {
    onSave({
      ...s,
      sellPrice:   Number(s.sellPrice)   || 0,
      buyPrice:    Number(s.buyPrice)    || 0,
      fee:         Number(s.fee)         || 0,
      shippingFee: Number(s.shippingFee) || 0,
      packCost:    Number(s.packCost)    || 0,
      profit:      calcSaleProfit(s),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold">売上詳細を編集</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 max-h-[68vh] overflow-y-auto space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">商品名</label>
            <input type="text" value={s.productName} onChange={(e) => set('productName', e.target.value)} className={ic} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">売れた日付</label>
            <input type="date" value={s.soldDate} onChange={(e) => set('soldDate', e.target.value)} className={ic} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">プラットフォーム</label>
            <select value={s.platform} onChange={(e) => handlePlatformChange(e.target.value)} className={ic}>
              <option value="">未設定</option>
              {PLATFORM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {[
            { key: 'sellPrice',   label: '売上額（円）' },
            { key: 'buyPrice',    label: '仕入れ値（円）' },
            { key: 'fee',         label: '手数料（円）' },
            { key: 'shippingFee', label: '送料（円）' },
            { key: 'packCost',    label: '梱包材費（円）' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
              <input type="text" inputMode="numeric" value={s[key]} onChange={numericInput(key)} className={ic} />
            </div>
          ))}
          <ProfitPreview s={s} />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-red-400 bg-red-50 hover:bg-red-100 transition">削除</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => onDelete(s.id)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition">確認</button>
              <button onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 transition">戻る</button>
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="rounded-lg px-5 py-2 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition">キャンセル</button>
            <button onClick={handleSave} className="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">保存</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 新規売上登録モーダル ──────────────────────────────────
function NewSaleModal({ onSave, onClose, feeRates, onFeeRatesChange }) {
  const [s, setS] = useState({
    id:          crypto.randomUUID(),
    productId:   '',
    productName: '',
    soldDate:    new Date().toISOString().slice(0, 10),
    platform:    '',
    sellPrice:   '',
    buyPrice:    '',
    fee:         '',
    shippingFee: '',
    packCost:    '',
  })
  const [errors, setErrors] = useState({})

  function set(key, val) {
    setS((prev) => ({ ...prev, [key]: val }))
  }

  function numericInput(key) {
    return (e) => {
      const v = e.target.value
      if (v === '' || /^[0-9]+$/.test(v)) set(key, v)
    }
  }

  function handlePlatformChange(pf) {
    setS((prev) => {
      const fee = autoFee(prev.sellPrice, pf, feeRates)
      return { ...prev, platform: pf, fee: fee ? String(fee) : '' }
    })
  }

  function handleSellPriceChange(val) {
    if (val !== '' && !/^[0-9]+$/.test(val)) return
    setS((prev) => {
      const fee = autoFee(val, prev.platform, feeRates)
      return { ...prev, sellPrice: val, fee: fee ? String(fee) : '' }
    })
  }

  function handleRakumaFeeChange(newRate) {
    // ローカルのfeeを更新
    setS((prev) => {
      const fee = prev.sellPrice ? String(Math.round(Number(prev.sellPrice) * newRate)) : ''
      return { ...prev, fee }
    })
    // App全体に反映
    if (onFeeRatesChange) onFeeRatesChange({ ...feeRates, rakuma: newRate })
  }

  function handleSave() {
    const e = {}
    if (!s.soldDate)        e.soldDate  = '日付を入力してください'
    if (!s.productName)     e.name      = '商品名を入力してください'
    if (s.sellPrice === '') e.sellPrice = '売上額を入力してください'
    if (Object.keys(e).length > 0) { setErrors(e); return }
    onSave({
      ...s,
      sellPrice:   Number(s.sellPrice)   || 0,
      buyPrice:    Number(s.buyPrice)    || 0,
      fee:         Number(s.fee)         || 0,
      shippingFee: Number(s.shippingFee) || 0,
      packCost:    Number(s.packCost)    || 0,
      profit:      calcSaleProfit(s),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-emerald-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold">売上を新規登録</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 max-h-[68vh] overflow-y-auto space-y-3">

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">商品名 <span className="text-red-400">*</span></label>
            <input type="text" value={s.productName} onChange={(e) => set('productName', e.target.value)}
              placeholder="例：ヴィンテージTシャツ" className={ic} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">売れた日付 <span className="text-red-400">*</span></label>
            <input type="date" value={s.soldDate} onChange={(e) => set('soldDate', e.target.value)} className={ic} />
            {errors.soldDate && <p className="text-xs text-red-500 mt-1">{errors.soldDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">プラットフォーム</label>
            <select value={s.platform} onChange={(e) => handlePlatformChange(e.target.value)} className={ic}>
              <option value="">選択してください</option>
              {PLATFORM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* ラクマ選択時：手数料率セレクト */}
          {s.platform === 'rakuma' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ラクマ手数料率</label>
              <select
                value={feeRates?.rakuma ?? 0.10}
                onChange={(e) => handleRakumaFeeChange(Number(e.target.value))}
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
            <input type="text" inputMode="numeric" value={s.sellPrice}
              onChange={(e) => handleSellPriceChange(e.target.value)} className={ic} />
            {errors.sellPrice && <p className="text-xs text-red-500 mt-1">{errors.sellPrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">仕入れ値（円）</label>
            <input type="text" inputMode="numeric" value={s.buyPrice} onChange={numericInput('buyPrice')} className={ic} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              手数料（円）<span className="ml-2 text-[10px] text-gray-400 font-normal">自動計算</span>
            </label>
            <input type="text" inputMode="numeric" value={s.fee} onChange={numericInput('fee')} className={ic} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">送料（円）</label>
            <input type="text" inputMode="numeric" value={s.shippingFee} onChange={numericInput('shippingFee')} className={ic} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">梱包材費（円）</label>
            <input type="text" inputMode="numeric" value={s.packCost} onChange={numericInput('packCost')} className={ic} />
          </div>

          {/* リアルタイム損益プレビュー */}
          <ProfitPreview s={s} />
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-5 py-2 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition">キャンセル</button>
          <button onClick={handleSave} className="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition">登録する</button>
        </div>
      </div>
    </div>
  )
}

// ── CSV出力ユーティリティ ─────────────────────────────────
const PLATFORM_LABEL_CSV = {
  mercari: 'メルカリ',
  yahoo:   'Yahoo!フリマ',
  rakuma:  'ラクマ',
  yahuoku: 'ヤフオク',
}

function escCsv(val) {
  const s = String(val ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function buildCsv(sales, targetMonth) {
  const filtered = sales
    .filter((s) => s.soldDate && s.soldDate.startsWith(targetMonth))
    .sort((a, b) => a.soldDate.localeCompare(b.soldDate))

  if (filtered.length === 0) return null

  // ── ヘッダー行 ──────────────────────────────────────────
  // 収支内訳書・簿記の補助明細に転用できるフォーマット
  const headers = [
    '取引日',
    '勘定科目',
    '取引区分',
    '摘要（商品名）',
    '販売プラットフォーム',
    '売上金額（円）',
    '仕入原価（円）',
    '販売手数料（円）',
    '発送送料（円）',
    '梱包材費（円）',
    '経費合計（円）',
    '差引利益（円）',
    '備考',
  ]

  const rows = filtered.map((s) => {
    const sellPrice   = Number(s.sellPrice)   || 0
    const buyPrice    = Number(s.buyPrice)    || 0
    const fee         = Number(s.fee)         || 0
    const shippingFee = Number(s.shippingFee) || 0
    const packCost    = Number(s.packCost)    || 0
    const costTotal   = buyPrice + fee + shippingFee + packCost
    const profit      = sellPrice - costTotal
    const platform    = PLATFORM_LABEL_CSV[s.platform] || s.platform || '不明'
    const isBundle    = s.isBundle ? 'まとめ売り' : '通常'

    return [
      s.soldDate,
      '売上高',          // 勘定科目
      isBundle,
      s.productName || '',
      platform,
      sellPrice,
      buyPrice,
      fee,
      shippingFee,
      packCost,
      costTotal,
      profit,
      s.isBundle ? `${s.bundleCount || ''}商品のまとめ売り` : '',
    ].map(escCsv).join(',')
  })

  // ── 合計行 ──────────────────────────────────────────────
  const totSell    = filtered.reduce((s, r) => s + (Number(r.sellPrice)   || 0), 0)
  const totBuy     = filtered.reduce((s, r) => s + (Number(r.buyPrice)    || 0), 0)
  const totFee     = filtered.reduce((s, r) => s + (Number(r.fee)         || 0), 0)
  const totShip    = filtered.reduce((s, r) => s + (Number(r.shippingFee) || 0), 0)
  const totPack    = filtered.reduce((s, r) => s + (Number(r.packCost)    || 0), 0)
  const totCost    = totBuy + totFee + totShip + totPack
  const totProfit  = totSell - totCost

  const summaryRow = [
    `${targetMonth} 月次合計`,
    '',
    '',
    `${filtered.length}件`,
    '',
    totSell,
    totBuy,
    totFee,
    totShip,
    totPack,
    totCost,
    totProfit,
    '',
  ].map(escCsv).join(',')

  // ── BOM付きUTF-8（Excelで開いても文字化けしない） ────────
  const csvContent = '\uFEFF' + [headers.join(','), ...rows, '', summaryRow].join('\r\n')
  return { csvContent, count: filtered.length }
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── CSV出力モーダル ───────────────────────────────────────
function CsvExportModal({ sales, onClose }) {
  const [targetMonth, setTargetMonth] = useState(() => new Date().toISOString().slice(0, 7))

  // 選択中の月のデータ件数プレビュー
  const previewCount = sales.filter((s) => s.soldDate?.startsWith(targetMonth)).length

  // 選択可能な月一覧（売上データに含まれる月）
  const availableMonths = useMemo(() => {
    const set = new Set(sales.map((s) => s.soldDate?.slice(0, 7)).filter(Boolean))
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [sales])

  function handleExport() {
    const result = buildCsv(sales, targetMonth)
    if (!result) return
    const [year, month] = targetMonth.split('-')
    const filename = `売上明細_${year}年${month}月.csv`
    downloadCsv(result.csvContent, filename)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold">CSV出力</h2>
            <p className="text-blue-100 text-xs mt-0.5">確定申告・簿記向けフォーマット</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* 対象月選択 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">出力対象月</label>
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
            />
            {/* 既存データの月をクイック選択 */}
            {availableMonths.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {availableMonths.slice(0, 6).map((m) => (
                  <button key={m} onClick={() => setTargetMonth(m)}
                    className={[
                      'rounded-lg px-2.5 py-1 text-xs font-semibold border transition',
                      targetMonth === m
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100',
                    ].join(' ')}>
                    {m.replace('-', '年')}月
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* プレビュー */}
          <div className={`rounded-xl px-4 py-3 ${previewCount > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="text-sm font-semibold text-gray-700">
              {targetMonth.replace('-', '年')}月のデータ
            </p>
            <p className={`text-2xl font-black mt-1 ${previewCount > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
              {previewCount}<span className="text-sm font-normal ml-1">件</span>
            </p>
            {previewCount > 0 && (
              <p className="text-xs text-blue-500 mt-1">この件数のデータがCSVに出力されます</p>
            )}
          </div>

          {/* 出力内容の説明 */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-gray-600 mb-2">出力項目</p>
            {[
              '取引日 / 勘定科目（売上高）/ 取引区分',
              '摘要（商品名）/ 販売プラットフォーム',
              '売上金額 / 仕入原価 / 販売手数料',
              '発送送料 / 梱包材費 / 経費合計',
              '差引利益 / 月次合計行',
            ].map((item, i) => (
              <p key={i} className="text-[11px] text-gray-500 flex items-start gap-1">
                <span className="text-blue-400 shrink-0 mt-0.5">✓</span>{item}
              </p>
            ))}
            <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-200">
              ※ BOM付きUTF-8形式。ExcelでそのままCSVを開いても文字化けしません。
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
            キャンセル
          </button>
          <button
            onClick={handleExport}
            disabled={previewCount === 0}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            CSVをダウンロード
          </button>
        </div>
      </div>
    </div>
  )
}

// ── メインページ ──────────────────────────────────────────
export default function SummaryPage({ feeRates, onFeeRatesChange }) {
  const [sales, setSales]           = useState([])
  const [period, setPeriod]         = useState('month')
  const [viewType, setViewType]     = useState('number')
  const [showDetail, setShowDetail] = useState(false)
  const [editingSale, setEditingSale]     = useState(null)
  const [showNewSale, setShowNewSale]     = useState(false)
  const [showCsvModal, setShowCsvModal]   = useState(false)   // CSV出力
  const [selectedGroup, setSelectedGroup] = useState(null)

  // 初回ロード
  useEffect(() => { setSales(getAllSales()) }, [])

  // salesStore から sales-updated イベントを受け取って即時リフレッシュ
  useEffect(() => {
    function onUpdate() { setSales(getAllSales()) }
    window.addEventListener('sales-updated', onUpdate)
    return () => window.removeEventListener('sales-updated', onUpdate)
  }, [])

  function handleSaveSale(sale) {
    saveSale(sale) // saveSale内でsales-updatedを発火 → useEffectで自動リフレッシュ
    setEditingSale(null)
    setShowNewSale(false)
  }

  function handleDeleteSale(id) {
    deleteSale(id) // deleteSale内でsales-updatedを発火
    setEditingSale(null)
  }

  // 期間グループ化
  const grouped = useMemo(() => {
    const map = {}
    for (const s of sales) {
      const key = period === 'day'   ? s.soldDate
                : period === 'month' ? toMonth(s.soldDate)
                :                      toYear(s.soldDate)
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => ({ key, items, agg: aggregateSales(items) }))
  }, [sales, period])

  const totalAgg = useMemo(() => aggregateSales(sales), [sales])
  const ranking  = useMemo(() => platformRanking(sales), [sales])

  const pieData = useMemo(() => {
    if (totalAgg.sellPrice === 0) return []
    return [
      { label: '純利益',   value: Math.max(totalAgg.profit, 0), color: '#10b981' },
      { label: '手数料',   value: totalAgg.fee,                  color: '#ef4444' },
      { label: '送料',     value: totalAgg.shippingFee,          color: '#f97316' },
      { label: '梱包材費', value: totalAgg.packCost,             color: '#a855f7' },
      { label: '仕入れ',   value: totalAgg.buyPrice,             color: '#64748b' },
    ].filter((d) => d.value > 0)
  }, [totalAgg])

  const pfPieData = useMemo(() =>
    ranking.map((r) => ({
      label: PLATFORM_LABEL[r.platform] || r.platform,
      value: r.count,
      color: PLATFORM_COLOR[r.platform] || '#9ca3af',
    })), [ranking])

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">

      {/* 操作エリア */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-2 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {[['day','日別'],['month','月別'],['year','年別']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={['rounded-md px-3 py-1.5 text-xs font-semibold transition',
                period === v ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400'].join(' ')}>{l}</button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {/* CSV出力ボタン */}
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M2 13a1 1 0 001 1h10a1 1 0 000-2H3a1 1 0 00-1 1zm3-5.707a1 1 0 011.414 0L7 8.586V3a1 1 0 112 0v5.586l.586-.586a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            CSV
          </button>
          <button onClick={() => setShowNewSale(true)}
            className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition">
            ＋ 売上登録
          </button>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-gray-400">売上データがありません。</p>
          <p className="text-xs text-gray-300 mt-1">商品管理の「売れた！」ボタンか「＋売上登録」から追加できます。</p>
        </div>
      ) : (
        <>
          {/* 全体集計 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">全期間合計</p>
            <div className="grid grid-cols-3 gap-2">
              <SummaryCard label="売上" value={totalAgg.sellPrice} color="text-blue-600" />
              <SummaryCard label="純利益" value={totalAgg.profit} color={totalAgg.profit >= 0 ? 'text-emerald-600' : 'text-red-500'} />
              <SummaryCard label="販売数" value={totalAgg.count} prefix="" suffix="件" />
              <SummaryCard label="手数料合計" value={totalAgg.fee} color="text-red-500" />
              <SummaryCard label="送料合計" value={totalAgg.shippingFee} color="text-orange-500" />
              <SummaryCard label="梱包材費合計" value={totalAgg.packCost} color="text-purple-500" />
            </div>
          </div>

          {/* 表示切り替え */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {[['number','数字'],['chart','グラフ']].map(([v,l]) => (
                <button key={v} onClick={() => setViewType(v)}
                  className={['rounded-md px-3 py-1.5 text-xs font-semibold transition',
                    viewType === v ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400'].join(' ')}>{l}</button>
              ))}
            </div>
            <button
              onClick={() => setShowDetail((v) => !v)}
              className={['ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold border transition',
                showDetail ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'].join(' ')}>
              {showDetail ? '詳細を閉じる' : '詳細を表示'}
            </button>
          </div>

          {/* グラフビュー */}
          {viewType === 'chart' && (
            <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">売上内訳（全期間）</p>
              <div className="flex items-center gap-4">
                <PieChart data={pieData} size={110} />
                <div className="flex flex-col gap-1.5">
                  {pieData.map((d) => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-gray-600">{d.label}</span>
                      <span className="text-xs font-semibold text-gray-800 ml-auto pl-2">¥{d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              {pfPieData.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-500 mt-5 mb-3">プラットフォーム別販売数</p>
                  <div className="space-y-2.5">
                    {(() => {
                      const maxVal = Math.max(...pfPieData.map((d) => d.value))
                      return pfPieData.map((d, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                              <span className="text-xs text-gray-600">{d.label}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-700">{d.value}件</span>
                          </div>
                          <div className="h-5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%`,
                                background: d.color,
                                opacity: 0.85,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </>
              )}
            </div>
          )}

          {/* プラットフォームランキング */}
          {showDetail && ranking.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">📊 フリマアプリ販売ランキング</p>
              <div className="space-y-2">
                {ranking.map((r, i) => (
                  <div key={r.platform} className="flex items-center gap-3">
                    <span className={['w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      i===0?'bg-yellow-400 text-yellow-900':i===1?'bg-gray-300 text-gray-700':i===2?'bg-amber-600 text-white':'bg-gray-100 text-gray-500'].join(' ')}>
                      {i+1}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 flex-1">{PLATFORM_LABEL[r.platform] || r.platform}</span>
                    <span className="text-sm font-bold text-blue-600">{r.count}件</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 期間別リスト */}
          <div className="space-y-3">
            {grouped.map(({ key, items, agg }) => (
              <div key={key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
                  onClick={() => setSelectedGroup(selectedGroup === key ? null : key)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-800">{key}</span>
                    <span className="text-xs text-gray-400">{agg.count}件</span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-[10px] text-gray-400">売上</p>
                      <p className="text-sm font-bold text-blue-600">¥{agg.sellPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">純利益</p>
                      <p className={`text-sm font-bold ${agg.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {agg.profit >= 0 ? '+' : ''}¥{agg.profit.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-gray-300 text-lg">{selectedGroup === key ? '▲' : '▼'}</span>
                  </div>
                </button>

                {viewType === 'number' && selectedGroup === key && (
                  <div className="border-t border-gray-100 px-4 py-3 grid grid-cols-3 gap-2">
                    <SummaryCard label="売上" value={agg.sellPrice} color="text-blue-600" />
                    <SummaryCard label="純利益" value={agg.profit} color={agg.profit >= 0 ? 'text-emerald-600' : 'text-red-500'} />
                    <SummaryCard label="仕入れ計" value={agg.buyPrice} color="text-gray-600" />
                    <SummaryCard label="手数料計" value={agg.fee} color="text-red-500" />
                    <SummaryCard label="送料計" value={agg.shippingFee} color="text-orange-500" />
                    <SummaryCard label="梱包材計" value={agg.packCost} color="text-purple-500" />
                  </div>
                )}

                {showDetail && selectedGroup === key && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {items.map((s) => (
                      <button key={s.id} onClick={() => setEditingSale(s)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{s.productName}</p>
                          <p className="text-[10px] text-gray-400">
                            {PLATFORM_LABEL[s.platform] || s.platform || '不明'} ／ {s.soldDate}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-bold text-blue-600">¥{Number(s.sellPrice).toLocaleString()}</p>
                          <p className={`text-xs font-semibold ${Number(s.profit) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            利益 {Number(s.profit) >= 0 ? '+' : ''}¥{Number(s.profit).toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {editingSale && (
        <SaleEditModal
          sale={editingSale}
          feeRates={feeRates}
          onSave={handleSaveSale}
          onDelete={handleDeleteSale}
          onClose={() => setEditingSale(null)}
        />
      )}

      {showNewSale && (
        <NewSaleModal
          onSave={handleSaveSale}
          onClose={() => setShowNewSale(false)}
          feeRates={feeRates}
          onFeeRatesChange={onFeeRatesChange}
        />
      )}

      {showCsvModal && (
        <CsvExportModal
          sales={sales}
          onClose={() => setShowCsvModal(false)}
        />
      )}
    </div>
  )
}