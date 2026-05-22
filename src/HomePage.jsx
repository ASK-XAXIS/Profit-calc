// HomePage.jsx
import { useState, useEffect, useRef } from 'react'
import { getAllProducts, getAllActiveProducts } from './productStore'
import { getAllSales, aggregateSales, toMonth } from './salesStore'

const LAYOUT_KEY = 'home_widget_order'

// ── ウィジェット定義 ──────────────────────────────────────
const WIDGET_DEFS = [
  { id: 'products', tab: 'products', label: '商品管理',    color: 'from-blue-500 to-blue-600',    icon: '📦' },
  { id: 'bundle',   tab: 'bundle',   label: 'まとめ売り',  color: 'from-emerald-500 to-emerald-600', icon: '🛒' },
  { id: 'calc',     tab: 'calc',     label: '利益計算機',  color: 'from-purple-500 to-purple-600', icon: '🧮' },
  { id: 'summary',  tab: 'summary',  label: '損益集計',    color: 'from-orange-500 to-orange-600', icon: '📊' },
]

// ── ローカルストレージからレイアウト読み込み ──────────────
function loadOrder() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return WIDGET_DEFS.map((w) => w.id)
    const saved = JSON.parse(raw)
    // 定義に存在するIDのみ保持、新規ウィジェットを末尾に追加
    const valid = saved.filter((id) => WIDGET_DEFS.some((w) => w.id === id))
    const missing = WIDGET_DEFS.map((w) => w.id).filter((id) => !valid.includes(id))
    return [...valid, ...missing]
  } catch {
    return WIDGET_DEFS.map((w) => w.id)
  }
}

function saveOrder(order) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(order))
}

// ── 商品管理ウィジェット内容 ──────────────────────────────
function ProductsWidgetContent() {
  const [data, setData] = useState({ total: 0, draft: 0, outOfStock: 0, recentNames: [] })

  useEffect(() => {
    function load() {
      const products = getAllProducts()
      const draft      = products.filter((p) => p.isDraft).length
      const outOfStock = products.filter((p) => !p.isDraft && Number(p.stock) <= 0).length
      const active     = products.filter((p) => !p.isDraft)
      const recentNames = active.slice(-3).reverse().map((p) => p.name)
      setData({ total: products.length, draft, outOfStock, recentNames })
    }
    load()
    window.addEventListener('products-updated', load)
    return () => window.removeEventListener('products-updated', load)
  }, [])

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-2">
        <div className="flex-1 bg-white/20 rounded-lg px-2 py-1.5 text-center">
          <p className="text-white/70 text-[9px]">登録数</p>
          <p className="text-white font-black text-lg leading-none">{data.total}</p>
        </div>
        <div className="flex-1 bg-white/20 rounded-lg px-2 py-1.5 text-center">
          <p className="text-white/70 text-[9px]">下書き</p>
          <p className="text-white font-black text-lg leading-none">{data.draft}</p>
        </div>
        <div className="flex-1 bg-white/20 rounded-lg px-2 py-1.5 text-center">
          <p className="text-white/70 text-[9px]">在庫なし</p>
          <p className={`font-black text-lg leading-none ${data.outOfStock > 0 ? 'text-red-200' : 'text-white'}`}>{data.outOfStock}</p>
        </div>
      </div>
      {data.recentNames.length > 0 && (
        <div className="flex-1 min-h-0">
          <p className="text-white/60 text-[9px] mb-1">最近の商品</p>
          <div className="space-y-0.5">
            {data.recentNames.map((name, i) => (
              <p key={i} className="text-white text-[10px] truncate leading-snug">• {name}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── まとめ売りウィジェット内容 ────────────────────────────
function BundleWidgetContent() {
  const [activeCount, setActiveCount] = useState(0)

  useEffect(() => {
    function load() {
      const active = getAllActiveProducts()
      setActiveCount(active.length)
    }
    load()
    window.addEventListener('products-updated', load)
    return () => window.removeEventListener('products-updated', load)
  }, [])

  // bundle draft
  const [hasDraft, setHasDraft] = useState(false)
  useEffect(() => {
    const raw = localStorage.getItem('bundle_draft')
    setHasDraft(!!raw)
  }, [])

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-2">
        <div className="flex-1 bg-white/20 rounded-lg px-2 py-1.5 text-center">
          <p className="text-white/70 text-[9px]">選択可能</p>
          <p className="text-white font-black text-lg leading-none">{activeCount}</p>
          <p className="text-white/60 text-[9px]">商品</p>
        </div>
        <div className="flex-1 bg-white/20 rounded-lg px-2 py-1.5 text-center">
          <p className="text-white/70 text-[9px]">最大</p>
          <p className="text-white font-black text-lg leading-none">5</p>
          <p className="text-white/60 text-[9px]">商品</p>
        </div>
      </div>
      {hasDraft && (
        <div className="rounded-lg bg-amber-400/30 border border-amber-300/50 px-2 py-1.5">
          <p className="text-amber-100 text-[10px] font-semibold">📝 一時保存あり</p>
        </div>
      )}
      <p className="text-white/60 text-[10px] leading-snug">
        複数商品をまとめて販売する際の価格計算と損益比較ができます
      </p>
    </div>
  )
}

// ── 計算機ウィジェット内容 ────────────────────────────────
function CalcWidgetContent() {
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="grid grid-cols-2 gap-1.5">
        {['メルカリ', 'Yahoo!', 'ラクマ', 'ヤフオク'].map((pf) => (
          <div key={pf} className="bg-white/20 rounded-lg px-2 py-1.5 text-center">
            <p className="text-white text-[9px] font-semibold leading-tight">{pf}</p>
          </div>
        ))}
      </div>
      <p className="text-white/60 text-[10px] leading-snug">
        4プラットフォームの利益を同時に計算。最低販売価格も自動算出します
      </p>
    </div>
  )
}

// ── 損益集計ウィジェット内容 ──────────────────────────────
function SummaryWidgetContent() {
  const [data, setData] = useState({ total: 0, monthProfit: 0, monthSell: 0 })

  useEffect(() => {
    function load() {
      const sales    = getAllSales()
      const thisMonth = new Date().toISOString().slice(0, 7)
      const monthly   = sales.filter((s) => toMonth(s.soldDate) === thisMonth)
      const agg       = aggregateSales(monthly)
      setData({ total: sales.length, monthProfit: agg.profit, monthSell: agg.sellPrice })
    }
    load()
    window.addEventListener('sales-updated', load)
    return () => window.removeEventListener('sales-updated', load)
  }, [])

  const profitColor = data.monthProfit > 0 ? 'text-emerald-200' : data.monthProfit < 0 ? 'text-red-200' : 'text-white'

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-2">
        <div className="flex-1 bg-white/20 rounded-lg px-2 py-1.5 text-center">
          <p className="text-white/70 text-[9px]">今月売上</p>
          <p className="text-white font-black text-sm leading-tight">¥{data.monthSell.toLocaleString()}</p>
        </div>
        <div className="flex-1 bg-white/20 rounded-lg px-2 py-1.5 text-center">
          <p className="text-white/70 text-[9px]">今月利益</p>
          <p className={`font-black text-sm leading-tight ${profitColor}`}>
            {data.monthProfit >= 0 ? '+' : ''}¥{data.monthProfit.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="bg-white/20 rounded-lg px-2 py-1.5 text-center">
        <p className="text-white/70 text-[9px]">累計販売数</p>
        <p className="text-white font-black text-lg leading-none">{data.total}<span className="text-white/60 text-[10px] font-normal ml-0.5">件</span></p>
      </div>
    </div>
  )
}

const WIDGET_CONTENT = {
  products: ProductsWidgetContent,
  bundle:   BundleWidgetContent,
  calc:     CalcWidgetContent,
  summary:  SummaryWidgetContent,
}

// ── ウィジェットカード ────────────────────────────────────
function WidgetCard({ def, onNavigate, isEditMode, onDragStart, onDragOver, onDrop, isDragOver }) {
  const Content = WIDGET_CONTENT[def.id]

  return (
    <div
      draggable={isEditMode}
      onDragStart={isEditMode ? onDragStart : undefined}
      onDragOver={isEditMode ? (e) => { e.preventDefault(); onDragOver() } : undefined}
      onDrop={isEditMode ? onDrop : undefined}
      onClick={() => !isEditMode && onNavigate(def.tab)}
      className={[
        `bg-gradient-to-br ${def.color} rounded-2xl p-3 flex flex-col gap-2 transition-all`,
        isEditMode
          ? 'cursor-grab active:cursor-grabbing shadow-xl scale-[0.98]'
          : 'cursor-pointer active:scale-[0.97] shadow-md',
        isDragOver ? 'ring-2 ring-white/80 scale-[1.02]' : '',
      ].join(' ')}
      style={{ minHeight: '160px' }}
    >
      {/* ウィジェットヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isEditMode && (
            <span className="text-white/60 text-sm select-none">⠿</span>
          )}
          <span className="text-base">{def.icon}</span>
          <span className="text-white font-bold text-xs">{def.label}</span>
        </div>
        {!isEditMode && (
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-white/60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 4l4 4-4 4" />
          </svg>
        )}
      </div>

      {/* コンテンツ */}
      <div className="flex-1 min-h-0">
        <Content />
      </div>
    </div>
  )
}

// ── ホームページメイン ────────────────────────────────────
export default function HomePage({ onNavigate }) {
  const [order, setOrder]         = useState(loadOrder)
  const [isEditMode, setEditMode] = useState(false)
  const [dragId, setDragId]       = useState(null)
  const [overIdx, setOverIdx]     = useState(null)

  function handleDragStart(id) { setDragId(id) }
  function handleDragOver(idx) { setOverIdx(idx) }

  function handleDrop(dropIdx) {
    if (dragId === null) return
    const dragIdx = order.indexOf(dragId)
    if (dragIdx === dropIdx) { setDragId(null); setOverIdx(null); return }
    const next = [...order]
    next.splice(dragIdx, 1)
    next.splice(dropIdx, 0, dragId)
    setOrder(next)
    saveOrder(next)
    setDragId(null)
    setOverIdx(null)
  }

  function toggleEditMode() {
    setEditMode((v) => !v)
    setDragId(null)
    setOverIdx(null)
  }

  const widgets = order.map((id) => WIDGET_DEFS.find((w) => w.id === id)).filter(Boolean)

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-3">

      {/* ホームヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-700">フリマ利益計算</h2>
          <p className="text-[10px] text-gray-400">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button
          onClick={toggleEditMode}
          className={[
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition border',
            isEditMode
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200',
          ].join(' ')}
        >
          {isEditMode ? '✓ 完了' : '⠿ 並び替え'}
        </button>
      </div>

      {/* 編集モードヒント */}
      {isEditMode && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-600">
          ドラッグ＆ドロップでウィジェットの並び順を変更できます。完了を押すと保存されます。
        </div>
      )}

      {/* ウィジェットグリッド（2列） */}
      <div className="grid grid-cols-2 gap-3">
        {widgets.map((def, idx) => (
          <WidgetCard
            key={def.id}
            def={def}
            onNavigate={onNavigate}
            isEditMode={isEditMode}
            isDragOver={overIdx === idx && dragId !== def.id}
            onDragStart={() => handleDragStart(def.id)}
            onDragOver={() => handleDragOver(idx)}
            onDrop={() => handleDrop(idx)}
          />
        ))}
      </div>

      {/* タップヒント */}
      {!isEditMode && (
        <p className="text-center text-[10px] text-gray-300">各カードをタップしてモードに移動</p>
      )}
    </div>
  )
}