// feeConfig.jsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// ─────────────────────────────────────────
// 定数・ユーティリティ
// ─────────────────────────────────────────
export const RAKUMA_FEE_OPTIONS = [
  { label: '10%（通常）', value: 0.10  },
  { label: '9%',          value: 0.09  },
  { label: '8%',          value: 0.08  },
  { label: '7%',          value: 0.07  },
  { label: '6%',          value: 0.06  },
  { label: '4.5%',        value: 0.045 },
]

export const RAKUMA_FEE_KEY = 'rakuma_fee_rate'

export function loadRakumaFee() {
  const saved = localStorage.getItem(RAKUMA_FEE_KEY)
  return saved ? Number(saved) : 0.10
}

export function saveRakumaFee(val) {
  localStorage.setItem(RAKUMA_FEE_KEY, String(val))
}

export function feeLabel(rate) {
  return (rate * 100).toFixed(1).replace('.0', '') + '%'
}

// ─────────────────────────────────────────
// FeeBadge
// ─────────────────────────────────────────
// ドロップダウンは createPortal + position:fixed で描画
// → overflow:hidden / スクロールコンテナ / z-index に一切影響されない
// → スマホ・モーダル内・計算機カード内すべてで正常動作
//
// Props:
//   platform      : プラットフォームkey ('rakuma' のみ変更可)
//   feeRate       : 現在の手数料率
//   onFeeChange   : (newRate: number) => void
//   dark          : ヘッダー背景が暗い場合 true（デフォルト true）
//   label         : バッジ左側に表示するテキスト（ヘッダー用）
export function FeeBadge({ platform, feeRate, onFeeChange, dark = true, label }) {
  const [open, setOpen] = useState(false)
  // fixed座標（viewport基準）で管理
  const [fixedPos, setFixedPos] = useState({ top: 0, right: 0 })
  const btnRef  = useRef(null)
  const isRakuma  = platform === 'rakuma'
  const isChanged = isRakuma && Math.abs(feeRate - 0.10) > 0.0001

  function openMenu(e) {
    e.stopPropagation()
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      // fixed座標 = viewport座標（scrollY不要）
      setFixedPos({
        top:   rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })
    }
    setOpen(true)
  }

  // スクロール・リサイズ・Escape で閉じる
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll',  close, true)
    window.addEventListener('resize',  close)
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
    return () => {
      window.removeEventListener('scroll',  close, true)
      window.removeEventListener('resize',  close)
    }
  }, [open])

  const displayText = label
    ? `${label} ${feeLabel(feeRate)}`
    : feeLabel(feeRate)

  // ラクマ以外：固定表示のみ
  if (!isRakuma) {
    return (
      <span className={[
        'text-[10px] font-semibold rounded px-1.5 py-0.5 select-none whitespace-nowrap',
        dark ? 'bg-white/20 text-white/80' : 'bg-gray-100 text-gray-500',
      ].join(' ')}>
        {displayText}
      </span>
    )
  }

  return (
    <>
      {/* トリガーボタン */}
      <button
        ref={btnRef}
        onPointerDown={openMenu}
        className={[
          'flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold select-none whitespace-nowrap transition-opacity active:opacity-70',
          isChanged
            ? 'bg-yellow-300 text-yellow-900'
            : dark
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 text-gray-600 border border-gray-200',
        ].join(' ')}
        title="タップして手数料率を変更"
      >
        {displayText}
        <svg viewBox="0 0 10 10" fill="none" className="w-2 h-2 shrink-0"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>

      {/* Portal: body直下に fixed で描画 */}
      {open && createPortal(
        <>
          {/* 透明オーバーレイ（タップで閉じる） */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onPointerDown={(e) => { e.stopPropagation(); setOpen(false) }}
          />

          {/* ドロップダウン本体 */}
          <div
            style={{
              position: 'fixed',          // ← fixed に統一（スクロール量不要）
              top:      fixedPos.top,
              right:    fixedPos.right,
              zIndex:   9999,
              minWidth: '160px',
            }}
            className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                ラクマ手数料率
              </p>
            </div>
            {RAKUMA_FEE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  onFeeChange(opt.value)
                  setOpen(false)
                }}
                className={[
                  'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors',
                  Math.abs(feeRate - opt.value) < 0.0001
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-gray-700 active:bg-gray-100',
                ].join(' ')}
              >
                <span>{opt.label}</span>
                {Math.abs(feeRate - opt.value) < 0.0001 && (
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-blue-500 shrink-0"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M3 8l3.5 3.5L13 4" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  )
}