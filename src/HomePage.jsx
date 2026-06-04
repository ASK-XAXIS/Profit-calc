// HomePage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { getAllProducts, getAllActiveProducts } from './productStore'
import { getAllSales, aggregateSales, toMonth } from './salesStore'

const LAYOUT_KEY = 'home_widget_order'

// ── ウィジェット定義 ──────────────────────────────────────
const WIDGET_DEFS = [
  { id: 'products', tab: 'products', label: '商品管理',   color: '#3b82f6', gradEnd: '#2563eb', icon: '📦' },
  { id: 'bundle',   tab: 'bundle',   label: 'まとめ売り', color: '#10b981', gradEnd: '#059669', icon: '🛒' },
  { id: 'calc',     tab: 'calc',     label: '利益計算機', color: '#8b5cf6', gradEnd: '#7c3aed', icon: '🧮' },
  { id: 'summary',  tab: 'summary',  label: '損益集計',   color: '#f97316', gradEnd: '#ea580c', icon: '📊' },
]

function loadOrder() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return WIDGET_DEFS.map((w) => w.id)
    const saved = JSON.parse(raw)
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

// ── ウィジェットコンテンツ ────────────────────────────────
function ProductsWidgetContent() {
  const [d, setD] = useState({ total: 0, draft: 0, outOfStock: 0, recentNames: [] })
  useEffect(() => {
    function load() {
      const p = getAllProducts()
      setD({
        total: p.length,
        draft: p.filter((x) => x.isDraft).length,
        outOfStock: p.filter((x) => !x.isDraft && Number(x.stock) <= 0).length,
        recentNames: p.filter((x) => !x.isDraft).slice(-3).reverse().map((x) => x.name),
      })
    }
    load()
    window.addEventListener('products-updated', load)
    return () => window.removeEventListener('products-updated', load)
  }, [])
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-1.5">
        {[
          { label: '登録数', val: d.total, warn: false },
          { label: '下書き', val: d.draft, warn: false },
          { label: '在庫なし', val: d.outOfStock, warn: d.outOfStock > 0 },
        ].map((item) => (
          <div key={item.label} className="flex-1 rounded-xl py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.label}</p>
            <p className="font-black text-lg leading-none" style={{ color: item.warn ? '#fca5a5' : 'white' }}>{item.val}</p>
          </div>
        ))}
      </div>
      {d.recentNames.length > 0 && (
        <div>
          <p className="text-[9px] mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>最近の商品</p>
          {d.recentNames.map((name, i) => (
            <p key={i} className="text-[10px] truncate leading-snug" style={{ color: 'white' }}>• {name}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function BundleWidgetContent() {
  const [count, setCount] = useState(0)
  const [hasDraft, setHasDraft] = useState(false)
  useEffect(() => {
    function load() { setCount(getAllActiveProducts().length); setHasDraft(!!localStorage.getItem('bundle_draft')) }
    load()
    window.addEventListener('products-updated', load)
    return () => window.removeEventListener('products-updated', load)
  }, [])
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-1.5">
        <div className="flex-1 rounded-xl py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.7)' }}>選択可能</p>
          <p className="font-black text-lg leading-none text-white">{count}</p>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.6)' }}>商品</p>
        </div>
        <div className="flex-1 rounded-xl py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.7)' }}>最大</p>
          <p className="font-black text-lg leading-none text-white">*5</p>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.6)' }}>商品</p>
        </div>
      </div>
      {hasDraft && (
        <div className="rounded-xl px-2 py-1" style={{ background: 'rgba(251,191,36,0.3)', border: '1px solid rgba(251,191,36,0.5)' }}>
          <p className="text-[10px] font-semibold" style={{ color: '#fef3c7' }}>📝 一時保存あり</p>
        </div>
      )}
      <p className="text-[10px] leading-snug" style={{ color: 'rgba(255,255,255,0.6)' }}>複数商品をまとめて販売する際の価格計算と損益比較</p>
      <p className="text-[8px] leading-snug" style ={{ color: 'rgba(255,255,255,0.6)'}}>*有料版購入後の最大数です（無料版は最大2商品）</p>
    </div>
  )
}

function CalcWidgetContent() {
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="grid grid-cols-2 gap-1.5">
        {['メルカリ', 'Yahoo!', 'ラクマ', 'ヤフオク'].map((pf) => (
          <div key={pf} className="rounded-xl py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <p className="text-[10px] font-semibold text-white">{pf}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] leading-snug" style={{ color: 'rgba(255,255,255,0.6)' }}>4プラットフォームの利益を同時計算。最低販売価格も算出</p>
    </div>
  )
}

function SummaryWidgetContent() {
  const [d, setD] = useState({ total: 0, monthProfit: 0, monthSell: 0 })
  useEffect(() => {
    function load() {
      const sales = getAllSales()
      const thisMonth = new Date().toISOString().slice(0, 7)
      const agg = aggregateSales(sales.filter((s) => toMonth(s.soldDate) === thisMonth))
      setD({ total: sales.length, monthProfit: agg.profit, monthSell: agg.sellPrice })
    }
    load()
    window.addEventListener('sales-updated', load)
    return () => window.removeEventListener('sales-updated', load)
  }, [])
  const profitPositive = d.monthProfit >= 0
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-1.5">
        <div className="flex-1 rounded-xl py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.7)' }}>今月売上</p>
          <p className="font-black text-xs leading-tight text-white">¥{d.monthSell.toLocaleString()}</p>
        </div>
        <div className="flex-1 rounded-xl py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.7)' }}>今月利益</p>
          <p className="font-black text-xs leading-tight" style={{ color: profitPositive ? '#6ee7b7' : '#fca5a5' }}>
            {d.monthProfit >= 0 ? '+' : ''}¥{d.monthProfit.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="rounded-xl py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.7)' }}>累計販売数</p>
        <p className="font-black text-lg leading-none text-white">{d.total}<span className="text-[10px] font-normal ml-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>件</span></p>
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

// ── ドラッグ対応グリッド ──────────────────────────────────
// PC: mousedown + mousemove
// スマホ: touchstart + touchmove（スクロールをpreventDefault）
function SortableGrid({ order, onOrderChange, isEditMode, onNavigate }) {
  const [dragging, setDragging] = useState(null)   // ドラッグ中のindex
  const [overIdx, setOverIdx]   = useState(null)   // ホバー中のindex
  const [ghostPos, setGhostPos] = useState(null)   // ゴーストの {x, y}
  const containerRef            = useRef(null)
  const itemRefs                = useRef({})        // id→DOMノード
  const dragStartPos            = useRef(null)      // ドラッグ開始座標
  const isDragging              = useRef(false)
  const LONG_PRESS_MS           = 150              // 長押し判定（短め）

  // ドラッグ中のアイテムID
  const draggingId = dragging !== null ? order[dragging] : null

  // タッチ/マウス共通の移動処理
  const onMove = useCallback((clientX, clientY) => {
    if (!isDragging.current || dragging === null) return
    setGhostPos({ x: clientX, y: clientY })

    // どのセルの上にいるか計算
    const container = containerRef.current
    if (!container) return
    const ids = order
    for (let i = 0; i < ids.length; i++) {
      const el = itemRefs.current[ids[i]]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (
        clientX >= rect.left && clientX <= rect.right &&
        clientY >= rect.top  && clientY <= rect.bottom
      ) {
        if (i !== dragging) setOverIdx(i)
        break
      }
    }
  }, [dragging, order])

  // ドラッグ終了
  const onEnd = useCallback(() => {
    if (!isDragging.current) { isDragging.current = false; return }
    isDragging.current = false
    if (dragging !== null && overIdx !== null && dragging !== overIdx) {
      const next = [...order]
      const [moved] = next.splice(dragging, 1)
      next.splice(overIdx, 0, moved)
      onOrderChange(next)
    }
    setDragging(null)
    setOverIdx(null)
    setGhostPos(null)
    dragStartPos.current = null
  }, [dragging, overIdx, order, onOrderChange])

  // グローバルイベント登録（mousemove / touchmove / mouseup / touchend）
  useEffect(() => {
    if (dragging === null) return

    function onMouseMove(e) { onMove(e.clientX, e.clientY) }
    function onTouchMove(e) {
      e.preventDefault()  // スクロールを止める
      const t = e.touches[0]
      onMove(t.clientX, t.clientY)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('mouseup',   onEnd)
    window.addEventListener('touchend',  onEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseup',   onEnd)
      window.removeEventListener('touchend',  onEnd)
    }
  }, [dragging, onMove, onEnd])

  function startDrag(idx, clientX, clientY) {
    isDragging.current = true
    dragStartPos.current = { x: clientX, y: clientY }
    setDragging(idx)
    setOverIdx(null)
    setGhostPos({ x: clientX, y: clientY })
  }

  const widgets = order.map((id) => WIDGET_DEFS.find((w) => w.id === id)).filter(Boolean)

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-3 relative">
      {widgets.map((def, idx) => {
        const Content   = WIDGET_CONTENT[def.id]
        const isDragSrc = dragging === idx
        const isOver    = overIdx === idx && dragging !== idx

        return (
          <div
            key={def.id}
            ref={(el) => { itemRefs.current[def.id] = el }}
            // タップ（クリック）
            onClick={() => {
              if (!isEditMode && !isDragging.current) onNavigate(def.tab)
            }}
            // マウスドラッグ開始
            onMouseDown={isEditMode ? (e) => {
              e.preventDefault()
              startDrag(idx, e.clientX, e.clientY)
            } : undefined}
            // タッチドラッグ開始
            onTouchStart={isEditMode ? (e) => {
              const t = e.touches[0]
              startDrag(idx, t.clientX, t.clientY)
            } : undefined}
            style={{
              minHeight: 160,
              background: `linear-gradient(135deg, ${def.color}, ${def.gradEnd})`,
              borderRadius: 16,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              cursor: isEditMode ? (isDragSrc ? 'grabbing' : 'grab') : 'pointer',
              opacity: isDragSrc ? 0.4 : 1,
              transform: isOver ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.15s, opacity 0.15s',
              outline: isOver ? '2px solid rgba(255,255,255,0.8)' : 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              touchAction: isEditMode ? 'none' : 'auto',  // ← 編集モード中はタッチスクロールを無効
            }}
          >
            {/* ヘッダー */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isEditMode && (
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, lineHeight: 1, cursor: 'grab' }}>⠿</span>
                )}
                <span style={{ fontSize: 18 }}>{def.icon}</span>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{def.label}</span>
              </div>
              {!isEditMode && (
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M6 4l4 4-4 4" />
                </svg>
              )}
            </div>

            {/* コンテンツ */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <Content />
            </div>
          </div>
        )
      })}

      {/* ドラッグゴースト（視覚フィードバック） */}
      {isDragging.current && ghostPos && draggingId && (() => {
        const def = WIDGET_DEFS.find((w) => w.id === draggingId)
        if (!def) return null
        return (
          <div
            style={{
              position: 'fixed',
              left: ghostPos.x - 80,
              top:  ghostPos.y - 40,
              width: 160,
              background: `linear-gradient(135deg, ${def.color}, ${def.gradEnd})`,
              borderRadius: 16,
              padding: 12,
              opacity: 0.85,
              pointerEvents: 'none',
              zIndex: 9999,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              transform: 'rotate(2deg) scale(1.05)',
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 20 }}>{def.icon}</span>
            {def.label}
          </div>
        )
      })()}
    </div>
  )
}

// ── ホームページメイン ────────────────────────────────────
export default function HomePage({ onNavigate, onLegal }) {
  const [order, setOrder]         = useState(loadOrder)
  const [isEditMode, setEditMode] = useState(false)

  function handleOrderChange(next) {
    setOrder(next)
    saveOrder(next)
  }

  function toggleEditMode() {
    setEditMode((v) => !v)
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-3">

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-lg font-black text-blue-500 tracking-tight">Revofit</h2>
            <span className="text-[10px] text-gray-400 font-normal">レヴォフィット</span>
          </div>
          <p className="text-[10px] text-gray-400">
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={toggleEditMode}
          className={[
            'rounded-xl px-3 py-2 text-xs font-semibold transition border',
            isEditMode
              ? 'bg-blue-500 text-white border-blue-500 shadow-md'
              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200',
          ].join(' ')}
        >
          {isEditMode ? '✓ 完了' : '⠿ 並び替え'}
        </button>
      </div>

      {/* 編集モードヒント */}
      {isEditMode && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2">
          <p className="text-xs text-blue-600 font-semibold">✋ 各カードを押したままドラッグして並び替えられます</p>
          <p className="text-[10px] text-blue-400 mt-0.5">完了を押すと順番が保存されます</p>
        </div>
      )}

      {/* ソート可能グリッド */}
      <SortableGrid
        order={order}
        onOrderChange={handleOrderChange}
        isEditMode={isEditMode}
        onNavigate={onNavigate}
      />

      {!isEditMode && (
        <p className="text-center text-[10px] text-gray-300">各カードをタップしてモードに移動</p>
      )}

      {/* 法的ページリンク */}
      {!isEditMode && (
        <div className="mt-2 border-t border-gray-200 pt-4 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <a
            href="/guide.html"
            className="text-[10px] text-blue-400 hover:text-blue-600 underline transition font-semibold"
          >
            📖 使い方ガイド
          </a>
          <button
            onClick={() => onLegal('privacy')}
            className="text-[10px] text-gray-400 hover:text-blue-500 underline transition"
          >
            プライバシーポリシー
          </button>
          <button
            onClick={() => onLegal('terms')}
            className="text-[10px] text-gray-400 hover:text-blue-500 underline transition"
          >
            利用規約
          </button>
          <button
            onClick={() => onLegal('commercial')}
            className="text-[10px] text-gray-400 hover:text-blue-500 underline transition"
          >
            特定商取引法に基づく表記
          </button>
        </div>
      )}
    </div>
  )
}
