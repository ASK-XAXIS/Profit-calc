// SummaryPage.jsx
import { useState, useMemo, useEffect } from 'react'
import {
  getAllSales, saveSale, deleteSale, createEmptySale,
  aggregateSales, platformRanking, toMonth, toYear, calcSaleProfit,
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

// ── ミニ円グラフ ──────────────────────────────────────────
function PieChart({ data, size = 120 }) {
  // data: [{ label, value, color }]
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="text-xs text-gray-400 text-center py-4">データなし</div>

  let cumAngle = -Math.PI / 2
  const cx = size / 2, cy = size / 2, r = size / 2 - 4

  function slice(value) {
    const angle = (value / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(cumAngle)
    const y1 = cy + r * Math.sin(cumAngle)
    cumAngle += angle
    const x2 = cx + r * Math.cos(cumAngle)
    const y2 = cy + r * Math.sin(cumAngle)
    const large = angle > Math.PI ? 1 : 0
    return `M${cx},${cy} L${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} Z`
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => (
        <path key={i} d={slice(d.value)} fill={d.color} opacity={0.9} />
      ))}
    </svg>
  )
}

// ── 集計カード ─────────────────────────────────────────────
function SummaryCard({ label, value, color = 'text-gray-800', prefix = '¥' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-3">
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      <p className={`text-base font-black leading-none ${color}`}>
        {prefix}{Number(value).toLocaleString()}
        <span className="text-xs font-normal ml-0.5">円</span>
      </p>
    </div>
  )
}

// ── 売上編集モーダル ──────────────────────────────────────
function SaleEditModal({ sale: initial, onSave, onDelete, onClose }) {
  const [s, setS] = useState({ ...initial,
    sellPrice:   String(initial.sellPrice   ?? ''),
    buyPrice:    String(initial.buyPrice    ?? ''),
    fee:         String(initial.fee         ?? ''),
    shippingFee: String(initial.shippingFee ?? ''),
    packCost:    String(initial.packCost    ?? ''),
    profit:      String(initial.profit      ?? ''),
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  function set(key, val) {
    setS((prev) => {
      const next = { ...prev, [key]: val }
      const profit = (Number(next.sellPrice)||0) - (Number(next.buyPrice)||0)
        - (Number(next.fee)||0) - (Number(next.shippingFee)||0) - (Number(next.packCost)||0)
      next.profit = String(profit)
      return next
    })
  }

  function numericInput(key) {
    return (e) => {
      const v = e.target.value
      if (v === '' || /^[0-9]+$/.test(v)) set(key, v)
    }
  }

  function handleSave() {
    onSave({
      ...s,
      sellPrice:   Number(s.sellPrice)   || 0,
      buyPrice:    Number(s.buyPrice)    || 0,
      fee:         Number(s.fee)         || 0,
      shippingFee: Number(s.shippingFee) || 0,
      packCost:    Number(s.packCost)    || 0,
      profit:      Number(s.profit)      || 0,
    })
  }

  const profitNum = Number(s.profit) || 0

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
            <input type="text" value={s.productName}
              onChange={(e) => set('productName', e.target.value)} className={ic} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">売れた日付</label>
            <input type="date" value={s.soldDate}
              onChange={(e) => set('soldDate', e.target.value)} className={ic} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">プラットフォーム</label>
            <select value={s.platform} onChange={(e) => set('platform', e.target.value)} className={ic}>
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
              <input type="text" inputMode="numeric" value={s[key]}
                onChange={numericInput(key)} className={ic} />
            </div>
          ))}

          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">純利益（自動計算）</span>
              <span className={`text-xl font-black ${profitNum >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {profitNum >= 0 ? '+' : ''}{profitNum.toLocaleString()}円
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-red-400 bg-red-50 hover:bg-red-100 transition">
              削除
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => onDelete(s.id)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition">確認</button>
              <button onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 transition">戻る</button>
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition">キャンセル</button>
            <button onClick={handleSave}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">保存</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 新規売上登録モーダル ──────────────────────────────────
function NewSaleModal({ onSave, onClose, feeRates }) {
  const [s, setS] = useState(createEmptySale())

  function set(key, val) {
    setS((prev) => {
      const next = { ...prev, [key]: val }
      const profit = (Number(next.sellPrice)||0) - (Number(next.buyPrice)||0)
        - (Number(next.fee)||0) - (Number(next.shippingFee)||0) - (Number(next.packCost)||0)
      next.profit = String(profit)
      return next
    })
  }

  function handlePlatformChange(pf) {
    const rate = feeRates?.[pf] ?? defaultFeeRate[pf] ?? 0
    const sp = Number(s.sellPrice) || 0
    const fee = sp && rate ? String(Math.round(sp * rate)) : s.fee
    setS((prev) => {
      const next = { ...prev, platform: pf, fee }
      const profit = sp - (Number(next.buyPrice)||0) - (Number(fee)||0) - (Number(next.shippingFee)||0) - (Number(next.packCost)||0)
      next.profit = String(profit)
      return next
    })
  }

  function numericInput(key) {
    return (e) => {
      const v = e.target.value
      if (v === '' || /^[0-9]+$/.test(v)) set(key, v)
    }
  }

  const [errors, setErrors] = useState({})
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
      profit:      Number(s.profit)      || 0,
    })
  }

  const profitNum = Number(s.profit) || 0

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
            <input type="text" value={s.productName} onChange={(e) => set('productName', e.target.value)} className={ic} placeholder="例：ヴィンテージTシャツ" />
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
          {[
            { key: 'sellPrice',   label: '売上額（円）', required: true },
            { key: 'buyPrice',    label: '仕入れ値（円）' },
            { key: 'fee',         label: '手数料（円）' },
            { key: 'shippingFee', label: '送料（円）' },
            { key: 'packCost',    label: '梱包材費（円）' },
          ].map(({ key, label, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {label}{required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input type="text" inputMode="numeric" value={s[key]} onChange={numericInput(key)} className={ic} />
              {key === 'sellPrice' && errors.sellPrice && <p className="text-xs text-red-500 mt-1">{errors.sellPrice}</p>}
            </div>
          ))}
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">純利益（自動計算）</span>
              <span className={`text-xl font-black ${profitNum >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {profitNum >= 0 ? '+' : ''}{profitNum.toLocaleString()}円
              </span>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-5 py-2 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition">キャンセル</button>
          <button onClick={handleSave} className="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition">登録する</button>
        </div>
      </div>
    </div>
  )
}

// ── メインページ ──────────────────────────────────────────
export default function SummaryPage({ feeRates }) {
  const [sales, setSales]           = useState([])
  const [period, setPeriod]         = useState('month')   // 'day' | 'month' | 'year'
  const [viewType, setViewType]     = useState('number')  // 'number' | 'chart'
  const [showDetail, setShowDetail] = useState(false)
  const [editingSale, setEditingSale]     = useState(null)
  const [showNewSale, setShowNewSale]     = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null) // 詳細表示する期間グループ

  useEffect(() => { setSales(getAllSales()) }, [])

  function refresh() { setSales(getAllSales()) }

  function handleSaveSale(sale) {
    saveSale(sale)
    refresh()
    setEditingSale(null)
    setShowNewSale(false)
  }

  function handleDeleteSale(id) {
    deleteSale(id)
    refresh()
    setEditingSale(null)
  }

  // 期間でグループ化
  const grouped = useMemo(() => {
    const map = {}
    for (const s of sales) {
      const key = period === 'day'   ? s.soldDate
                : period === 'month' ? toMonth(s.soldDate)
                :                      toYear(s.soldDate)
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    // 降順ソート
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => ({ key, items, agg: aggregateSales(items) }))
  }, [sales, period])

  // 全体集計
  const totalAgg = useMemo(() => aggregateSales(sales), [sales])

  // プラットフォームランキング
  const ranking = useMemo(() => platformRanking(sales), [sales])

  // 円グラフ用データ（利益内訳）
  const pieData = useMemo(() => {
    if (totalAgg.sellPrice === 0) return []
    return [
      { label: '純利益',    value: Math.max(totalAgg.profit, 0),      color: '#10b981' },
      { label: '手数料',    value: totalAgg.fee,                       color: '#ef4444' },
      { label: '送料',      value: totalAgg.shippingFee,               color: '#f97316' },
      { label: '梱包材費',  value: totalAgg.packCost,                  color: '#a855f7' },
      { label: '仕入れ',    value: totalAgg.buyPrice,                  color: '#64748b' },
    ].filter((d) => d.value > 0)
  }, [totalAgg])

  // プラットフォーム別売上グラフ用
  const pfPieData = useMemo(() =>
    ranking.map((r) => ({
      label: PLATFORM_LABEL[r.platform] || r.platform,
      value: r.count,
      color: PLATFORM_COLOR[r.platform] || '#9ca3af',
    })), [ranking])

  const periodLabel = { day: '日別', month: '月別', year: '年別' }[period]

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">

      {/* ── ヘッダー操作エリア ── */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-2 flex-wrap">
        {/* 期間切り替え */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {[['day','日別'],['month','月別'],['year','年別']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={['rounded-md px-3 py-1.5 text-xs font-semibold transition',
                period === v ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400'].join(' ')}>
              {l}
            </button>
          ))}
        </div>

        {/* 新規登録 */}
        <button
          onClick={() => setShowNewSale(true)}
          className="ml-auto flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition"
        >
          ＋ 売上登録
        </button>
      </div>

      {sales.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-gray-400">売上データがありません。</p>
          <p className="text-xs text-gray-300 mt-1">商品管理の「売れた！」ボタンか「＋売上登録」から追加できます。</p>
        </div>
      ) : (
        <>
          {/* ── 全体集計サマリ ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">全期間合計</p>
            <div className="grid grid-cols-3 gap-2">
              <SummaryCard label="売上" value={totalAgg.sellPrice} color="text-blue-600" />
              <SummaryCard label="純利益" value={totalAgg.profit} color={totalAgg.profit >= 0 ? 'text-emerald-600' : 'text-red-500'} />
              <SummaryCard label="販売数" value={totalAgg.count} prefix="" />
              <SummaryCard label="手数料合計" value={totalAgg.fee} color="text-red-500" />
              <SummaryCard label="送料合計" value={totalAgg.shippingFee} color="text-orange-500" />
              <SummaryCard label="梱包材費合計" value={totalAgg.packCost} color="text-purple-500" />
            </div>
          </div>

          {/* ── 表示切り替え（数字 / グラフ） ── */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {[['number','数字'],['chart','グラフ']].map(([v,l]) => (
                <button key={v} onClick={() => setViewType(v)}
                  className={['rounded-md px-3 py-1.5 text-xs font-semibold transition',
                    viewType === v ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400'].join(' ')}>
                  {l}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 ml-1">{periodLabel}の内訳</p>
            {/* 詳細表示トグル */}
            <button
              onClick={() => setShowDetail((v) => !v)}
              className={['ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold border transition',
                showDetail
                  ? 'bg-blue-50 border-blue-300 text-blue-600'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              ].join(' ')}
            >
              {showDetail ? '詳細を閉じる' : '詳細を表示'}
            </button>
          </div>

          {/* ── グラフビュー ── */}
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
                      <span className="text-xs font-semibold text-gray-800 ml-auto pl-2">
                        ¥{d.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {pfPieData.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-500 mt-4 mb-3">プラットフォーム別販売数</p>
                  <div className="flex items-center gap-4">
                    <PieChart data={pfPieData} size={110} />
                    <div className="flex flex-col gap-1.5">
                      {pfPieData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-xs text-gray-600">{d.label}</span>
                          <span className="text-xs font-semibold text-gray-800 ml-auto pl-2">{d.value}件</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── プラットフォームランキング（詳細時） ── */}
          {showDetail && ranking.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">📊 フリマアプリ販売ランキング</p>
              <div className="space-y-2">
                {ranking.map((r, i) => (
                  <div key={r.platform} className="flex items-center gap-3">
                    <span className={[
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      i === 0 ? 'bg-yellow-400 text-yellow-900'
                      : i === 1 ? 'bg-gray-300 text-gray-700'
                      : i === 2 ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-500',
                    ].join(' ')}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 flex-1">
                      {PLATFORM_LABEL[r.platform] || r.platform}
                    </span>
                    <span className="text-sm font-bold text-blue-600">{r.count}件</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 期間別リスト ── */}
          <div className="space-y-3">
            {grouped.map(({ key, items, agg }) => (
              <div key={key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* 期間ヘッダー */}
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

                {/* 数字ビュー（展開時） */}
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

                {/* 詳細リスト（showDetail時） */}
                {showDetail && selectedGroup === key && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {items.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setEditingSale(s)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
                      >
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

      {/* 編集モーダル */}
      {editingSale && (
        <SaleEditModal
          sale={editingSale}
          onSave={handleSaveSale}
          onDelete={handleDeleteSale}
          onClose={() => setEditingSale(null)}
        />
      )}

      {/* 新規登録モーダル */}
      {showNewSale && (
        <NewSaleModal
          onSave={handleSaveSale}
          onClose={() => setShowNewSale(false)}
          feeRates={feeRates}
        />
      )}
    </div>
  )
}