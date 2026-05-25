import { useState, useCallback, useMemo, useEffect } from 'react'
import { feeRate as defaultFeeRate, shippingOptions } from './constants'
import { calcFee, calcProfit } from './calc'
import { loadRakumaFee, saveRakumaFee, FeeBadge } from './feeConfig.jsx'
import ProductManager, { ViewModeToggle } from './ProductManager'
import SummaryPage from './SummaryPage'
import BundlePage from './BundlePage'
import HomePage from './HomePage'
import { PrivacyPolicy, TermsOfService, CommercialDisclosure } from './LegalPages'
import UpgradeModal, { handleStripeReturn } from './UpgradeModal'
import AdBanner from './AdBanner'
import { isPremium, canUseCalc, getRemainingCalcCount, incrementDailyCalcCount, getDailyCalcCount } from './planStore'

// ─────────────────────────────────────────
// タブ定義（中央がホーム）
// ─────────────────────────────────────────
const TABS = [
  {
    id: 'products',
    label: '商品管理',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9h7.5M8.25 12h7.5M8.25 15h4.5" />
      </svg>
    ),
  },
  {
    id: 'bundle',
    label: 'まとめ売り',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    id: 'home',
    label: 'ホーム',
    icon: (active) => (
      <div className={[
        'w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg border-4 border-white transition-all',
        active ? 'bg-blue-500' : 'bg-gray-400',
      ].join(' ')}>
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
    ),
  },
  {
    id: 'calc',
    label: '計算機',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path strokeLinecap="round" d="M8 7h8M8 11h3M8 15h3M15 11h1M15 15h1" />
      </svg>
    ),
  },
  {
    id: 'summary',
    label: '損益集計',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l5-5 4 4 5-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 20.25h18" />
        <circle cx="8" cy="8.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="17" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

// ─────────────────────────────────────────
// プラットフォームメタ情報
// ─────────────────────────────────────────
const PLATFORM_META = {
  mercari:  { label: 'メルカリ',     color: 'bg-red-500',    light: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600'    },
  yahoo:    { label: 'Yahoo!フリマ', color: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
  rakuma:   { label: 'ラクマ',       color: 'bg-blue-900',   light: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800'   },
  yahuoku:  { label: 'ヤフオク',     color: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
}

const PLATFORMS = ['mercari', 'yahoo', 'rakuma', 'yahuoku']

// ─────────────────────────────────────────
// 数値入力フィールド
// ─────────────────────────────────────────
function NumInput({ value, onChange, placeholder, suffix }) {
  return (
    <div className="flex items-center gap-0.5">
      <input
        type="text" inputMode="numeric" value={value}
        onChange={(e) => {
          const v = e.target.value
          if (v === '' || /^[0-9]+$/.test(v)) onChange(v === '' ? '' : Number(v))
        }}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-gray-300 focus:border-blue-400 outline-none text-right text-gray-800 py-0.5 text-xs"
      />
      {suffix && <span className="text-gray-400 text-[10px] shrink-0">{suffix}</span>}
    </div>
  )
}

// ─────────────────────────────────────────
// 計算機：プラットフォーム結果カラム
// ─────────────────────────────────────────
function PlatformColumn({ platform, globalSell, buyPrice, overrides, onOverride, feeRates, onFeeRatesChange }) {
  const meta     = PLATFORM_META[platform]
  const services = shippingOptions[platform]
  const ov       = overrides[platform]
  const rate     = feeRates[platform]

  const selSvc         = ov.service
  const svcObj         = services.find((s) => s.service === selSvc) || null
  const isNonAnonymous = svcObj ? svcObj.anonymous === false : false
  const shipObj        = svcObj?.options.find((o) => o.value === ov.shipping)

  const shipFee  = isNonAnonymous ? 0 : (shipObj ? shipObj.fee : 0)
  const packCost = isNonAnonymous ? (Number(ov.shipAndPackCost) || 0) : (Number(ov.packCost) || 0)

  const sp = Number(ov.sellPrice) || 0
  const bp = Number(buyPrice)     || 0

  // 販売価格が入力されているかどうか（グローバル売値 or 個別上書き）
  const hasSellPrice = ov.sellPrice !== '' && ov.sellPrice !== 0

  const fee    = Math.round(calcFee(sp, rate))
  const profit = Math.round(calcProfit(sp, bp, fee, shipFee, packCost))

  // 最高仕入れ額（販売価格入力済・仕入れ未入力のとき）
  const maxBuy = !hasSellPrice && bp === 0
    ? null  // 両方未入力 → 何も計算しない
    : null  // 使わない

  // 最低販売価格（仕入れ入力済・販売価格未入力のとき）
  // 損益ゼロになる最低売価 = ceil((buyPrice + shipFee + packCost) / (1 - rate))
  const minSellPrice = !hasSellPrice && bp > 0
    ? Math.ceil((bp + shipFee + packCost) / (1 - rate))
    : null

  function set(key, val) { onOverride(platform, { ...ov, [key]: val }) }
  function handleServiceChange(val) {
    onOverride(platform, { ...ov, service: val, shipping: '', packCost: '0', shipAndPackCost: '' })
  }

  // 表示モードを決定
  // A: 販売価格入力済 → 利益表示
  // B: 仕入れ入力済・販売価格未入力 → 最低販売価格表示
  // C: 両方未入力 → 空表示
  const displayMode = hasSellPrice ? 'profit'
    : bp > 0 ? 'minSell'
    : 'empty'

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border ${meta.border} bg-white`}>
      {/* ヘッダー */}
      <div className={`${meta.color} px-2 py-2 flex items-center justify-between`}>
        <span className="text-white font-bold text-[11px] leading-tight">{meta.label}</span>
        <FeeBadge
          platform={platform}
          feeRate={rate}
          onFeeChange={(val) => onFeeRatesChange({ ...feeRates, [platform]: val })}
          dark={true}
        />
      </div>

      <div className="px-2 py-2 flex flex-col gap-2 flex-1">
        {/* 販売価格 */}
        <div>
          <p className="text-[8px] text-gray-400 mb-0.5 uppercase tracking-wide">販売価格</p>
          <NumInput value={ov.sellPrice} onChange={(v) => set('sellPrice', v)} placeholder="---" suffix="円" />
        </div>

        {/* 発送サービス */}
        <div>
          <p className="text-[8px] text-gray-400 mb-0.5 uppercase tracking-wide">発送</p>
          <select value={selSvc} onChange={(e) => handleServiceChange(e.target.value)}
            className="w-full text-[9px] text-gray-700 bg-gray-50 border border-gray-200 rounded px-1 py-1 focus:outline-none mb-1">
            <option value="">選択</option>
            {services.map((s) => <option key={s.service} value={s.service}>{s.label}</option>)}
          </select>
          {selSvc && !isNonAnonymous && (
            <select value={ov.shipping} onChange={(e) => set('shipping', e.target.value)}
              className="w-full text-[9px] text-gray-700 bg-gray-50 border border-gray-200 rounded px-1 py-1 focus:outline-none">
              <option value="">方法選択</option>
              {(svcObj?.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
        </div>

        {/* 梱包材費 */}
        <div>
          {isNonAnonymous ? (
            <>
              <p className="text-[8px] text-gray-400 mb-0.5 uppercase tracking-wide">送料＋梱包材</p>
              <NumInput value={ov.shipAndPackCost} onChange={(v) => set('shipAndPackCost', v)} placeholder="0" suffix="円" />
              <p className="text-[8px] text-gray-300 mt-0.5">送料と梱包材の合計を入力</p>
            </>
          ) : (
            <>
              <p className="text-[8px] text-gray-400 mb-0.5 uppercase tracking-wide">梱包材</p>
              <NumInput value={ov.packCost} onChange={(v) => set('packCost', v)} placeholder="0" suffix="円" />
            </>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* 内訳 */}
        <div className="space-y-0.5 text-[9px] text-gray-400">
          {displayMode === 'profit' && (
            <>
              <div className="flex justify-between"><span>手数料</span><span>{fee.toLocaleString()}円</span></div>
              {isNonAnonymous ? (
                <div className="flex justify-between"><span>送料＋梱包材</span><span>{packCost.toLocaleString()}円</span></div>
              ) : (
                <>
                  <div className="flex justify-between"><span>送料</span><span>{shipFee.toLocaleString()}円</span></div>
                  <div className="flex justify-between"><span>梱包材</span><span>{packCost.toLocaleString()}円</span></div>
                </>
              )}
            </>
          )}
          {displayMode === 'minSell' && (
            <>
              {isNonAnonymous ? (
                <div className="flex justify-between"><span>送料＋梱包材</span><span>{packCost.toLocaleString()}円</span></div>
              ) : (
                <>
                  <div className="flex justify-between"><span>送料</span><span>{shipFee.toLocaleString()}円</span></div>
                  <div className="flex justify-between"><span>梱包材</span><span>{packCost.toLocaleString()}円</span></div>
                </>
              )}
              <div className="flex justify-between"><span>手数料率</span><span>{(rate * 100).toFixed(1).replace('.0', '')}%</span></div>
            </>
          )}
          {displayMode === 'empty' && (
            <p className="text-[8px] text-gray-300 text-center py-1">販売価格または仕入れ額を入力</p>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* ── 結果表示エリア ── */}
        {displayMode === 'profit' && (
          // A: 販売利益
          <div className={`rounded-lg px-1 py-2 text-center ${profit > 0 ? meta.light : profit < 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className="text-[8px] text-gray-400 mb-0.5">販売利益</p>
            <p className={`text-xl font-black leading-none ${profit > 0 ? meta.text : profit < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {profit > 0 ? '+' : ''}{profit.toLocaleString()}
            </p>
            <p className="text-[8px] text-gray-400 mt-0.5">円</p>
          </div>
        )}

        {displayMode === 'minSell' && (
          // B: 最低販売価格
          <div className={`rounded-lg px-1 py-2 text-center ${meta.light}`}>
            <p className="text-[8px] text-gray-500 mb-0.5 font-semibold">最低販売価格</p>
            <p className={`text-xl font-black leading-none ${meta.text}`}>
              {minSellPrice !== null ? minSellPrice.toLocaleString() : '---'}
            </p>
            <p className="text-[8px] text-gray-400 mt-0.5">円（損益±0）</p>
          </div>
        )}

        {displayMode === 'empty' && (
          // C: 未入力
          <div className="rounded-lg px-1 py-2 text-center bg-gray-50">
            <p className="text-[8px] text-gray-300 mb-0.5">---</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 計算機ページ
// ─────────────────────────────────────────
function CalcPage({ loadedProduct, setLoadedProduct, onSwitchToProducts, feeRates, onFeeRatesChange }) {
  const [globalSell, setGlobalSell]       = useState('')
  const [globalBuy,  setGlobalBuy]        = useState('')
  const [showPackInput, setShowPackInput] = useState(false)
  const [globalPack,    setGlobalPack]    = useState('')
  const [showResult,    setShowResult]    = useState(false) // 計算結果表示フラグ

  const initOverride = useCallback(() => ({
    mercari:  { sellPrice: '', service: '', shipping: '', packCost: '0', shipAndPackCost: '' },
    yahoo:    { sellPrice: '', service: '', shipping: '', packCost: '0', shipAndPackCost: '' },
    rakuma:   { sellPrice: '', service: '', shipping: '', packCost: '0', shipAndPackCost: '' },
    yahuoku:  { sellPrice: '', service: '', shipping: '', packCost: '0', shipAndPackCost: '' },
  }), [])

  const [overrides, setOverrides] = useState(initOverride)
  const [dailyCalcCount, setDailyCalcCount] = useState(getDailyCalcCount)
  const [calcLocked, setCalcLocked] = useState(() => !canUseCalc())

  function handleGlobalSell(val) {
    setGlobalSell(val)
    setOverrides((prev) => {
      const next = { ...prev }
      for (const pf of PLATFORMS) {
        if (prev[pf].sellPrice === '' || prev[pf].sellPrice === globalSell)
          next[pf] = { ...prev[pf], sellPrice: val }
      }
      return next
    })
  }

  function handleOverride(platform, val) {
    setOverrides((prev) => ({ ...prev, [platform]: val }))
  }

  // 「計算する」ボタン処理
  function handleCalc() {
    if (calcLocked) {
      window.__openUpgradeModal?.('calc')
      return
    }
    if (!isPremium()) {
      const { count, isLimitReached, wasAlreadyLocked } = incrementDailyCalcCount()
      setDailyCalcCount(count)
      if (isLimitReached && !wasAlreadyLocked) {
        window.__openUpgradeModal?.('calc')
      }
      if (isLimitReached) {
        setCalcLocked(true)
        return
      }
    }
    setShowResult(true)
  }

  function clearAll() {
    setGlobalSell(''); setGlobalBuy(''); setGlobalPack('')
    setShowPackInput(false); setOverrides(initOverride())
    setShowResult(false)
  }
  function clearSellAll() {
    setGlobalSell('')
    setOverrides((prev) => {
      const n = { ...prev }
      for (const pf of PLATFORMS) n[pf] = { ...prev[pf], sellPrice: '' }
      return n
    })
  }
  function clearShipAll() {
    setOverrides((prev) => {
      const n = { ...prev }
      for (const pf of PLATFORMS) n[pf] = { ...prev[pf], service: '', shipping: '', shipAndPackCost: '' }
      return n
    })
  }
  function clearPackAll() {
    setGlobalPack('')
    setOverrides((prev) => {
      const n = { ...prev }
      for (const pf of PLATFORMS) n[pf] = { ...prev[pf], packCost: '0', shipAndPackCost: '' }
      return n
    })
  }

  const [prevLoaded, setPrevLoaded] = useState(null)
  if (loadedProduct && loadedProduct !== prevLoaded) {
    setPrevLoaded(loadedProduct)
    const sp = loadedProduct.sellPrice !== '' ? loadedProduct.sellPrice : ''
    setGlobalSell(sp !== '' ? String(sp) : '')
    setGlobalBuy(loadedProduct.buyPrice !== '' ? String(loadedProduct.buyPrice) : '')
    setOverrides({
      mercari:  { sellPrice: sp, service: loadedProduct.platform==='mercari'  ?(loadedProduct.service||''):'', shipping: loadedProduct.platform==='mercari'  ?(loadedProduct.shipping||''):'', packCost: loadedProduct.packCost!==''?String(loadedProduct.packCost):'0', shipAndPackCost:'' },
      yahoo:    { sellPrice: sp, service: loadedProduct.platform==='yahoo'    ?(loadedProduct.service||''):'', shipping: loadedProduct.platform==='yahoo'    ?(loadedProduct.shipping||''):'', packCost: loadedProduct.packCost!==''?String(loadedProduct.packCost):'0', shipAndPackCost:'' },
      rakuma:   { sellPrice: sp, service: loadedProduct.platform==='rakuma'   ?(loadedProduct.service||''):'', shipping: loadedProduct.platform==='rakuma'   ?(loadedProduct.shipping||''):'', packCost: loadedProduct.packCost!==''?String(loadedProduct.packCost):'0', shipAndPackCost:'' },
      yahuoku:  { sellPrice: sp, service: loadedProduct.platform==='yahuoku'  ?(loadedProduct.service||''):'', shipping: loadedProduct.platform==='yahuoku'  ?(loadedProduct.shipping||''):'', packCost: loadedProduct.packCost!==''?String(loadedProduct.packCost):'0', shipAndPackCost:'' },
    })
  }

  function handleRegisterFromCalc() {
    onSwitchToProducts(() => {
      const el = document.getElementById('product-manager-add-btn')
      if (el) el.click()
    })
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-3">

      {/* 計算回数上限バナー（フリープランのみ） */}
      {!isPremium() && (
        <div className={`rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 ${calcLocked ? 'bg-red-50 border border-red-200' : dailyCalcCount >= 7 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-100'}`}>
          <div>
            {calcLocked ? (
              <>
                <p className="text-xs font-bold text-red-600">本日の計算回数の上限（10回）に達しました</p>
                <p className="text-[10px] text-red-400">日本時間 0:00 にリセットされます</p>
              </>
            ) : (
              <p className="text-[10px] text-gray-500">本日の残り計算回数：<span className="font-bold text-gray-700">{getRemainingCalcCount()}回</span></p>
            )}
          </div>
          {calcLocked && (
            <button
              onClick={() => window.__openUpgradeModal?.('calc')}
              className="shrink-0 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white"
            >
              解除する
            </button>
          )}
        </div>
      )}

      {loadedProduct && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-blue-400 font-semibold">編集中の商品</p>
            <p className="text-sm font-bold text-blue-800">{loadedProduct.name}</p>
          </div>
          <button onClick={() => { setLoadedProduct(null); setPrevLoaded(null) }} className="text-xs text-blue-400 hover:text-blue-600 underline shrink-0">解除</button>
        </div>
      )}

      {/* 共通入力 */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">共通入力</p>

        {/* 入力説明バッジ */}
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex items-start gap-1.5 bg-blue-50 rounded-xl px-3 py-2">
            <span className="text-blue-400 text-[10px] mt-0.5">💡</span>
            <p className="text-[10px] text-blue-600 leading-relaxed">
              <span className="font-bold">販売額を未入力</span>の場合、損益ゼロになる<span className="font-bold">最低販売額</span>を表示します
            </p>
          </div>
          <div className="flex items-start gap-1.5 bg-emerald-50 rounded-xl px-3 py-2">
            <span className="text-emerald-400 text-[10px] mt-0.5">💡</span>
            <p className="text-[10px] text-emerald-600 leading-relaxed">
              <span className="font-bold">仕入額を未入力</span>の場合、損益ゼロになる<span className="font-bold">最高仕入額</span>を表示します
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">販売額（円）</label>
            <input type="text" inputMode="numeric" value={globalSell}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^[0-9]+$/.test(v)) handleGlobalSell(v === '' ? '' : Number(v))
              }}
              placeholder="未入力 → 最低販売額"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">仕入額（円）</label>
            <input type="text" inputMode="numeric" value={globalBuy}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^[0-9]+$/.test(v)) setGlobalBuy(v === '' ? '' : Number(v))
              }}
              placeholder="未入力 → 最高仕入額"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
            />
          </div>
        </div>

        {/* 梱包材費一括入力 */}
        <div className="mt-3 border-t border-gray-100 pt-3">
          <button onClick={() => setShowPackInput((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">
            <span className="flex items-center gap-1.5"><span>📦</span> 梱包材費を一括入力</span>
            <span className={`text-gray-400 transition-transform ${showPackInput ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showPackInput && (
            <div className="mt-2 flex items-center gap-2">
              <input type="text" inputMode="numeric" value={globalPack}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '' || /^[0-9]+$/.test(v)) setGlobalPack(v === '' ? '' : Number(v))
                }}
                placeholder="例：50" autoFocus
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-base font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
              />
              <span className="text-sm text-gray-400 shrink-0">円</span>
              <button
                onClick={() => {
                  if (globalPack === '') return
                  setOverrides((prev) => {
                    const next = { ...prev }
                    for (const pf of PLATFORMS) {
                      const svcObj = shippingOptions[pf].find((s) => s.service === prev[pf].service)
                      const isNonAnon = svcObj ? svcObj.anonymous === false : false
                      next[pf] = isNonAnon
                        ? { ...prev[pf], shipAndPackCost: String(globalPack) }
                        : { ...prev[pf], packCost: String(globalPack) }
                    }
                    return next
                  })
                  setShowPackInput(false)
                }}
                className="shrink-0 rounded-xl bg-blue-500 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition"
              >
                一括適用
              </button>
            </div>
          )}
        </div>

        {/* 計算するボタン */}
        <button
          onClick={handleCalc}
          disabled={globalSell === '' && globalBuy === ''}
          className="mt-3 w-full rounded-xl bg-blue-500 py-3 text-sm font-black text-white hover:bg-blue-600 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 7h8M8 11h3M8 15h3M15 11h1M15 15h1" />
          </svg>
          計算する
          {!isPremium() && !calcLocked && (
            <span className="text-blue-200 text-[10px] font-normal">（残り{getRemainingCalcCount()}回）</span>
          )}
        </button>
      </div>

      {/* 4列プラットフォーム結果（計算後のみ表示） */}
      {showResult && (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            {PLATFORMS.map((pf) => (
              <PlatformColumn
                key={pf}
                platform={pf}
                globalSell={globalSell}
                buyPrice={globalBuy}
                overrides={overrides}
                onOverride={handleOverride}
                feeRates={feeRates}
                onFeeRatesChange={onFeeRatesChange}
              />
            ))}
          </div>

          <button onClick={handleRegisterFromCalc}
            className="w-full rounded-xl border border-blue-300 bg-blue-50 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition">
            この情報内容で商品管理に新規登録する →
          </button>

          {/* クリアボタン群 */}
          <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">クリア</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={clearSellAll} className="rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">販売額 クリア</button>
              <button onClick={() => setGlobalBuy('')} className="rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">仕入額 クリア</button>
              <button onClick={clearShipAll} className="rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">発送方法 クリア</button>
              <button onClick={clearPackAll} className="rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">梱包材費 クリア</button>
              <button onClick={clearAll} className="col-span-2 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-500 hover:bg-red-100 transition">全てクリア（結果を閉じる）</button>
            </div>
          </div>
          <AdBanner slot="6515851195" className="mt-1" />
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// ボトムナビ
// ─────────────────────────────────────────
function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
      <div className="flex max-w-lg mx-auto items-end pb-safe">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          const isHome = tab.id === 'home'
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={[
                'flex-1 flex flex-col items-center justify-end transition-colors relative',
                isHome ? 'pb-2' : 'py-3 pt-3',
                !isHome && (active ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'),
              ].join(' ')}
            >
              {tab.icon(active)}
              <span className={[
                'text-[10px] font-medium mt-1',
                isHome
                  ? active ? 'text-blue-500' : 'text-gray-400'
                  : active ? 'text-blue-500' : 'text-gray-400',
              ].join(' ')}>
                {tab.label}
              </span>
              {!isHome && active && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────
// App ルート
// ─────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab]         = useState('home')
  const [legalPage, setLegalPage]         = useState(null) // 'privacy' | 'terms' | 'commercial'
  const [viewMode, setViewMode]           = useState(() => localStorage.getItem('product_view_mode') || 'list')
  const [loadedProduct, setLoadedProduct] = useState(null)

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeTrigger,   setUpgradeTrigger]   = useState('manual')
  const [purchaseSuccess,  setPurchaseSuccess]  = useState(false)

  // Stripe決済リターン処理
  useEffect(() => {
    handleStripeReturn().then((success) => {
      if (success) {
        setPurchaseSuccess(true)
        setTimeout(() => setPurchaseSuccess(false), 3000)
      }
    })
  }, [])

  // アップグレードモーダルをwindowに登録
  useEffect(() => {
    window.__openUpgradeModal = (trigger = 'manual') => {
      setUpgradeTrigger(trigger)
      setShowUpgradeModal(true)
    }
    return () => { delete window.__openUpgradeModal }
  }, [])

  const [rakumaFee, setRakumaFee] = useState(loadRakumaFee)
  function handleFeeRatesChange(newRates) {
    const val = newRates.rakuma ?? rakumaFee
    setRakumaFee(val); saveRakumaFee(val)
  }
  const feeRates = useMemo(() => ({
    mercari:  defaultFeeRate.mercari,
    yahoo:    defaultFeeRate.yahoo,
    rakuma:   rakumaFee,
    yahuoku:  defaultFeeRate.yahuoku,
  }), [rakumaFee])

  function handleViewModeChange(mode) {
    setViewMode(mode); localStorage.setItem('product_view_mode', mode)
  }
  function handleLoadToCalc(product) { setLoadedProduct(product); setActiveTab('calc') }
  function handleSwitchToProducts(callback) {
    setActiveTab('products')
    if (callback) setTimeout(callback, 50)
  }

  const calcState = { sellPrice: '', buyPrice: '', platform: '', service: '', shipping: '', packCost: '' }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-800 mr-auto flex items-center gap-2">
            {legalPage ? (
              <>
                {legalPage === 'privacy'    && 'プライバシーポリシー'}
                {legalPage === 'terms'      && '利用規約'}
                {legalPage === 'commercial' && '特定商取引法に基づく表記'}
              </>
            ) : activeTab === 'home' ? (
              <span className="flex items-center gap-1.5">
                <span className="text-blue-500 font-black tracking-tight">Revofit</span>
                <span className="text-[10px] font-normal text-gray-400">レヴォフィット</span>
              </span>
            ) : (
              <>
                {activeTab === 'products' && '商品管理'}
                {activeTab === 'calc'     && '利益計算機'}
                {activeTab === 'summary'  && '損益集計'}
                {activeTab === 'bundle'   && 'まとめ売り計算'}
              </>
            )}
          </h1>
          {activeTab === 'products' && (
            <ViewModeToggle viewMode={viewMode} onChange={handleViewModeChange} />
          )}
          {/* リロードボタン（ソフトリフレッシュ） */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('products-updated'))
              window.dispatchEvent(new CustomEvent('sales-updated'))
            }}
            title="データを再読み込み"
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4v5h5M20 20v-5h-5" />
              <path d="M4 9a9 9 0 0114.65-3.65L20 9M4 15l1.35 3.65A9 9 0 0020 15" />
            </svg>
          </button>
        </div>
      </header>

      <main className="pb-32 pt-4 px-3">
        {/* 法的ページ（表示中はタブコンテンツを隠す） */}
        {legalPage === 'privacy'    && <PrivacyPolicy       onBack={() => setLegalPage(null)} />}
        {legalPage === 'terms'      && <TermsOfService      onBack={() => setLegalPage(null)} />}
        {legalPage === 'commercial' && <CommercialDisclosure onBack={() => setLegalPage(null)} />}

        {/* 通常タブ（法的ページ非表示時のみ） */}
        <div className={legalPage ? 'hidden' : ''}>
          <div className={activeTab === 'home' ? 'block' : 'hidden'}>
            <HomePage onNavigate={setActiveTab} onLegal={setLegalPage} />
            <div className="mt-3">
              <AdBanner slot="6515851195" />
            </div>
          </div>
          <div className={activeTab === 'products' ? 'block' : 'hidden'}>
            <AdBanner slot="6515851195" className="mb-3" />
            <ProductManager
              calcState={calcState}
              onLoadToCalc={handleLoadToCalc}
              addBtnId="product-manager-add-btn"
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              feeRates={feeRates}
              onFeeRatesChange={handleFeeRatesChange}
            />
          </div>
          <div className={activeTab === 'calc' ? 'block' : 'hidden'}>
            <CalcPage
              loadedProduct={loadedProduct}
              setLoadedProduct={setLoadedProduct}
              onSwitchToProducts={handleSwitchToProducts}
              feeRates={feeRates}
              onFeeRatesChange={handleFeeRatesChange}
            />
          </div>
          <div className={activeTab === 'summary' ? 'block' : 'hidden'}>
            <SummaryPage feeRates={feeRates} onFeeRatesChange={handleFeeRatesChange} />
          </div>
          <div className={activeTab === 'bundle' ? 'block' : 'hidden'}>
            <BundlePage feeRates={feeRates} onFeeRatesChange={handleFeeRatesChange} />
          </div>
        </div>
      </main>

      {/* 購入成功トースト */}
      {purchaseSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <span>🎉</span> プレミアムプランへようこそ！
        </div>
      )}

      {/* アップグレードモーダル */}
      {showUpgradeModal && (
        <UpgradeModal
          trigger={upgradeTrigger}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
