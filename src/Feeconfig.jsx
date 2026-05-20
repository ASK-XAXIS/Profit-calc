// feeConfig.jsx  ← .js → .jsx に変更（JSXを含むため）
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// ─────────────────────────────────────────
// 手数料設定の定数
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
// ラクマのみタップでプルダウン変更可能
// createPortal で body 直下に描画
// → overflow:hidden / z-index に影響されない
// ─────────────────────────────────────────
export function FeeBadge({ platform, feeRate, onFeeChange, dark = true }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, right: 0 })
  const btnRef          = useRef(null)
  const isRakuma        = platform === 'rakuma'
  const isChanged       = isRakuma && feeRate !== 0.10

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        top:   rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      })
    }
    setOpen(true)
  }

  // スクロール・リサイズで閉じる
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  // ラクマ以外は固定表示のみ（タップ不可）
  if (!isRakuma) {
    return (
      <span className={[
        'text-[10px] font-semibold rounded px-1.5 py-0.5 select-none',
        dark ? 'bg-white/20 text-white/80' : 'bg-gray-100 text-gray-500',
      ].join(' ')}>
        {feeLabel(feeRate)}
      </span>
    )
  }

  return (
    <>
      <button
        ref={btnRef}
        onPointerDown={(e) => { e.stopPropagation(); handleOpen() }}
        className={[
          'flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold transition select-none',
          isChanged
            ? 'bg-yellow-300 text-yellow-900'
            : dark
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 text-gray-600 border border-gray-200',
        ].join(' ')}
        title="タップして手数料率を変更"
      >
        {feeLabel(feeRate)}
        <svg viewBox="0 0 10 10" fill="none" className="w-2 h-2 shrink-0"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>

      {open && createPortal(
        <>
          {/* 透明オーバーレイ */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onPointerDown={() => setOpen(false)}
          />
          {/* ドロップダウン本体 */}
          <div
            style={{
              position: 'absolute',
              top:      pos.top,
              right:    pos.right,
              zIndex:   9999,
              minWidth: '160px',
            }}
            className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
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
                  'w-full flex items-center justify-between px-3 py-2.5 text-sm transition',
                  feeRate === opt.value
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-gray-700 active:bg-gray-100',
                ].join(' ')}
              >
                <span>{opt.label}</span>
                {feeRate === opt.value && (
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-blue-500"
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