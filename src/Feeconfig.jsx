// feeConfig.jsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

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
  try {
    const saved = localStorage.getItem(RAKUMA_FEE_KEY)
    return saved ? Number(saved) : 0.10
  } catch { return 0.10 }
}

export function saveRakumaFee(val) {
  try { localStorage.setItem(RAKUMA_FEE_KEY, String(val)) } catch {}
}

export function feeLabel(rate) {
  return (rate * 100).toFixed(1).replace('.0', '') + '%'
}

// ─────────────────────────────────────────
// FeeBadge
// Portal + fixed座標 + windowイベント方式
// ─────────────────────────────────────────
export function FeeBadge({ platform, feeRate, onFeeChange, dark = true }) {
  const [open, setOpen]     = useState(false)
  const [pos,  setPos]      = useState({ top: 0, right: 0 })
  const btnRef              = useRef(null)
  const menuRef             = useRef(null)
  const isRakuma            = platform === 'rakuma'
  const isChanged           = isRakuma && Math.abs(feeRate - 0.10) > 0.0001

  // 外側クリック/タップで閉じる（オーバーレイなしで確実に動く）
  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current  && !btnRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    // pointerdown と click 両方登録（スマホ対応）
    window.addEventListener('pointerdown', handleOutside, true)
    window.addEventListener('click',       handleOutside, true)
    return () => {
      window.removeEventListener('pointerdown', handleOutside, true)
      window.removeEventListener('click',       handleOutside, true)
    }
  }, [open])

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

  function handleBtnClick(e) {
    e.stopPropagation()
    e.preventDefault()
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      top:   rect.bottom + 4,
      right: window.innerWidth - rect.right,
    })
    setOpen((v) => !v)
  }

  function handleOptionSelect(e, val) {
    e.stopPropagation()
    e.preventDefault()
    onFeeChange(val)
    setOpen(false)
  }

  // ラクマ以外は固定表示のみ
  if (!isRakuma) {
    return (
      <span className={[
        'text-[10px] font-semibold rounded px-1.5 py-0.5 select-none whitespace-nowrap',
        dark ? 'bg-white/20 text-white/80' : 'bg-gray-100 text-gray-500',
      ].join(' ')}>
        {feeLabel(feeRate)}
      </span>
    )
  }

  return (
    <>
      {/* トリガーボタン */}
      <button
        ref={btnRef}
        type="button"
        onClick={handleBtnClick}
        className={[
          'flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold select-none whitespace-nowrap',
          isChanged
            ? 'bg-yellow-300 text-yellow-900'
            : dark
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 text-gray-600 border border-gray-200',
        ].join(' ')}
      >
        {feeLabel(feeRate)}
        <svg viewBox="0 0 10 10" fill="none" className="w-2 h-2 shrink-0"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>

      {/* Portal: body直下にfixedで描画 */}
      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top:      pos.top,
            right:    pos.right,
            zIndex:   2147483647, // 最大z-index
            minWidth: '160px',
          }}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              ラクマ手数料率
            </p>
          </div>
          {RAKUMA_FEE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={(e) => handleOptionSelect(e, opt.value)}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={[
                'w-full flex items-center justify-between px-3 py-3 text-sm',
                Math.abs(feeRate - opt.value) < 0.0001
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100',
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
        </div>,
        document.body
      )}
    </>
  )
}