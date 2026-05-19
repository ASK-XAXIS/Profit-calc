import { useState, useMemo, useCallback } from 'react'
import { feeRate, shippingOptions } from './constants'
import { calcFee, calcProfit, calcBreakEven } from './calc'
import { saveProduct } from './productStore'
import ProductManager, { ViewModeToggle } from './ProductManager'

// ─────────────────────────────────────────
// タブ定義
// ─────────────────────────────────────────
const TABS = [
  {
    id: 'products',
    label: '商品管理',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9h7.5M8.25 12h7.5M8.25 15h4.5" />
      </svg>
    ),
  },
  {
    id: 'calc',
    label: '計算機',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path strokeLinecap="round" d="M8 7h8M8 11h3M8 15h3M15 11h1M15 15h1" />
      </svg>
    ),
  },
]

// ─────────────────────────────────────────
// 定数
// ─────────────────────────────────────────
const PLATFORM_META = {
  mercari: { label: 'メルカリ',      color: 'bg-red-500',    light: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    dot: 'bg-red-500'    },
  yahoo:   { label: 'Yahoo!フリマ',  color: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', dot: 'bg-purple-500' },
  rakuma:  { label: 'ラクマ',        color: 'bg-blue-900',   light: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   dot: 'bg-blue-900'   },
}

// ─────────────────────────────────────────
// 数値入力フィールド（共通）
// ─────────────────────────────────────────
function NumInput({ value, onChange, placeholder, className = '', prefix, suffix }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {prefix && <span className="text-gray-400 text-sm shrink-0">{prefix}</span>}
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const v = e.target.value
          if (v === '' || /^[0-9]+$/.test(v)) onChange(v === '' ? '' : Number(v))
        }}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-gray-300 focus:border-blue-400 outline-none text-right text-gray-800 py-0.5 text-sm"
      />
      {suffix && <span className="text-gray-400 text-sm shrink-0">{suffix}</span>}
    </div>
  )
}

// ─────────────────────────────────────────
// プラットフォーム結果カラム
// ─────────────────────────────────────────
function PlatformColumn({ platform, buyPrice, overrides, onOverride }) {
  const meta     = PLATFORM_META[platform]
  const services = shippingOptions[platform]

  const ov        = overrides[platform]
  const sellPrice = ov.sellPrice
  const packCost  = Number(ov.packCost) || 0
  const selSvc    = ov.service
  const selShip   = ov.shipping

  // 選択中の送料
  const svcObj  = services.find((s) => s.service === selSvc)
  const shipObj = svcObj?.options.find((o) => o.value === selShip)
  const shipFee = shipObj ? shipObj.fee : 0

  // 計算
  const sp      = Number(sellPrice) || 0
  const bp      = Number(buyPrice)  || 0
  const fee     = Math.round(calcFee(sp, feeRate[platform]))
  const profit  = Math.round(calcProfit(sp, bp, fee, shipFee, packCost))
  // 仕入れ未入力時の最大仕入れ（損益ゼロになる仕入れ額）
  const maxBuy  = bp === 0
    ? Math.floor(sp - fee - shipFee - packCost)
    : null

  const profitPositive = profit > 0
  const profitNegative = profit < 0

  // 編集UI開閉
  const [editOpen, setEditOpen] = useState(false)

  function set(key, val) {
    onOverride(platform, { ...ov, [key]: val })
  }
  function setService(val) {
    onOverride(platform, { ...ov, service: val, shipping: '' })
  }

  const svcOptions = services
  const shipOptions = svcObj?.options || []

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden border ${meta.border} bg-white`}>

      {/* ヘッダー */}
      <div className={`${meta.color} px-3 py-2.5 flex items-center gap-2`}>
        <span className="text-white font-bold text-sm tracking-wide">{meta.label}</span>
        <span className="text-white/70 text-[10px] ml-auto">{(feeRate[platform] * 100).toFixed(0)}%</span>
      </div>

      {/* メイン数値エリア */}
      <div className="px-3 py-3 flex flex-col gap-2 flex-1">

        {/* 販売価格 */}
        <div>
          <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wide">販売価格</p>
          <NumInput
            value={sellPrice}
            onChange={(v) => set('sellPrice', v)}
            placeholder="---"
            suffix="円"
          />
        </div>

        {/* 発送方法 */}
        <div>
          <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wide">発送</p>
          <select
            value={selSvc}
            onChange={(e) => setService(e.target.value)}
            className="w-full text-[10px] text-gray-700 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300 mb-1"
          >
            <option value="">サービス選択</option>
            {svcOptions.map((s) => (
              <option key={s.service} value={s.service}>{s.label}</option>
            ))}
          </select>
          {selSvc && (
            <select
              value={selShip}
              onChange={(e) => set('shipping', e.target.value)}
              className="w-full text-[10px] text-gray-700 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              <option value="">方法選択</option>
              {shipOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* 梱包材費 */}
        <div>
          <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wide">梱包材</p>
          <NumInput
            value={ov.packCost}
            onChange={(v) => set('packCost', v)}
            placeholder="0"
            suffix="円"
          />
        </div>

        {/* 区切り */}
        <div className="border-t border-gray-100" />

        {/* 内訳 */}
        <div className="space-y-1 text-[10px] text-gray-500">
          <div className="flex justify-between">
            <span>手数料</span>
            <span>{fee.toLocaleString()}円</span>
          </div>
          <div className="flex justify-between">
            <span>送料</span>
            <span>{shipFee.toLocaleString()}円</span>
          </div>
          <div className="flex justify-between">
            <span>梱包材</span>
            <span>{packCost.toLocaleString()}円</span>
          </div>
        </div>

        {/* 区切り */}
        <div className="border-t border-gray-100" />

        {/* 利益 / 最大仕入れ */}
        {bp === 0 ? (
          /* 仕入れ未入力時 → 最大仕入れ額を大きく表示 */
          <div className="text-center">
            <p className="text-[9px] text-gray-400 mb-1">最高仕入れ額（損益±0）</p>
            <p className={`text-2xl font-black leading-none ${maxBuy > 0 ? meta.text : 'text-gray-300'}`}>
              {maxBuy > 0 ? maxBuy.toLocaleString() : '---'}
            </p>
            {maxBuy > 0 && <p className="text-[10px] text-gray-400 mt-0.5">円まで仕入れ可</p>}
          </div>
        ) : (
          /* 仕入れ入力時 → 損益を大きく表示 */
          <div className={`rounded-xl px-2 py-2.5 text-center ${
            profitPositive ? `${meta.light}` : profitNegative ? 'bg-red-50' : 'bg-gray-50'
          }`}>
            <p className="text-[9px] text-gray-400 mb-1">販売利益</p>
            <p className={`text-2xl font-black leading-none ${
              profitPositive ? meta.text : profitNegative ? 'text-red-500' : 'text-gray-400'
            }`}>
              {profit > 0 ? '+' : ''}{profit.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">円</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 計算機ページ（新UI）
// ─────────────────────────────────────────
function CalcPage({ loadedProduct, setLoadedProduct, onSwitchToProducts }) {

  // グローバル入力
  const [globalSell, setGlobalSell] = useState('')
  const [globalBuy,  setGlobalBuy]  = useState('')

  // プラットフォームごとの上書き値
  // sellPrice・service・shipping・packCost を個別管理
  const initOverride = useCallback(() => ({
    mercari: { sellPrice: '', service: '', shipping: '', packCost: '0' },
    yahoo:   { sellPrice: '', service: '', shipping: '', packCost: '0' },
    rakuma:  { sellPrice: '', service: '', shipping: '', packCost: '0' },
  }), [])

  const [overrides, setOverrides] = useState(initOverride)

  // グローバル売値が変わったらoverridesの未入力分に同期
  function handleGlobalSell(val) {
    setGlobalSell(val)
    setOverrides((prev) => {
      const next = { ...prev }
      for (const pf of Object.keys(next)) {
        // 既にカスタムで何か入力していればそのまま
        if (prev[pf].sellPrice === '' || prev[pf].sellPrice === globalSell) {
          next[pf] = { ...prev[pf], sellPrice: val }
        }
      }
      return next
    })
  }

  function handleOverride(platform, val) {
    setOverrides((prev) => ({ ...prev, [platform]: val }))
  }

  // 全クリア
  function clearAll() {
    setGlobalSell(''); setGlobalBuy('')
    setOverrides(initOverride())
  }
  // 販売価格のみクリア
  function clearSellAll() {
    setGlobalSell('')
    setOverrides((prev) => {
      const next = { ...prev }
      for (const pf of Object.keys(next)) next[pf] = { ...prev[pf], sellPrice: '' }
      return next
    })
  }
  // 発送方法クリア
  function clearShipAll() {
    setOverrides((prev) => {
      const next = { ...prev }
      for (const pf of Object.keys(next)) next[pf] = { ...prev[pf], service: '', shipping: '' }
      return next
    })
  }
  // 梱包材クリア
  function clearPackAll() {
    setOverrides((prev) => {
      const next = { ...prev }
      for (const pf of Object.keys(next)) next[pf] = { ...prev[pf], packCost: '0' }
      return next
    })
  }

  // 商品管理からロード
  const [prevLoaded, setPrevLoaded] = useState(null)
  if (loadedProduct && loadedProduct !== prevLoaded) {
    setPrevLoaded(loadedProduct)
    setGlobalSell(loadedProduct.sellPrice !== '' ? String(loadedProduct.sellPrice) : '')
    setGlobalBuy (loadedProduct.buyPrice  !== '' ? String(loadedProduct.buyPrice)  : '')
    const sp = loadedProduct.sellPrice !== '' ? loadedProduct.sellPrice : ''
    setOverrides({
      mercari: { sellPrice: sp, service: loadedProduct.platform === 'mercari' ? (loadedProduct.service || '') : '', shipping: loadedProduct.platform === 'mercari' ? (loadedProduct.shipping || '') : '', packCost: loadedProduct.packCost !== '' ? String(loadedProduct.packCost) : '0' },
      yahoo:   { sellPrice: sp, service: loadedProduct.platform === 'yahoo'   ? (loadedProduct.service || '') : '', shipping: loadedProduct.platform === 'yahoo'   ? (loadedProduct.shipping || '') : '', packCost: loadedProduct.packCost !== '' ? String(loadedProduct.packCost) : '0' },
      rakuma:  { sellPrice: sp, service: loadedProduct.platform === 'rakuma'  ? (loadedProduct.service || '') : '', shipping: loadedProduct.platform === 'rakuma'  ? (loadedProduct.shipping || '') : '', packCost: loadedProduct.packCost !== '' ? String(loadedProduct.packCost) : '0' },
    })
  }

  function handleRegisterFromCalc() {
    onSwitchToProducts(() => {
      const el = document.getElementById('product-manager-add-btn')
      if (el) el.click()
    })
  }

  const calcState = {
    sellPrice: globalSell, buyPrice: globalBuy,
    platform: '', service: '', shipping: '',
    packCost: overrides.mercari.packCost,
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">

      {/* ロード中商品バナー */}
      {loadedProduct && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-blue-400 font-semibold">編集中の商品</p>
            <p className="text-sm font-bold text-blue-800">{loadedProduct.name}</p>
          </div>
          <button
            onClick={() => { setLoadedProduct(null); setPrevLoaded(null) }}
            className="text-xs text-blue-400 hover:text-blue-600 underline shrink-0"
          >
            解除
          </button>
        </div>
      )}

      {/* ── グローバル入力エリア ── */}
      <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">共通入力</p>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">販売価格（円）</label>
            <input
              type="text"
              inputMode="numeric"
              value={globalSell}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^[0-9]+$/.test(v)) handleGlobalSell(v === '' ? '' : Number(v))
              }}
              placeholder="例：3,000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              仕入れ額（円）
              <span className="ml-1 text-[10px] text-gray-300 font-normal">未入力→最高仕入れ額を表示</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={globalBuy}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^[0-9]+$/.test(v)) setGlobalBuy(v === '' ? '' : Number(v))
              }}
              placeholder="未入力"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
            />
          </div>
        </div>
        <p className="text-[10px] text-gray-300 mt-2 text-center">
          ※ 販売価格・発送方法・梱包材は各プラットフォームごとに個別変更できます
        </p>
      </div>

      {/* ── プラットフォーム3列 ── */}
      <div className="grid grid-cols-3 gap-2">
        {['mercari', 'yahoo', 'rakuma'].map((pf) => (
          <PlatformColumn
            key={pf}
            platform={pf}
            buyPrice={globalBuy}
            overrides={overrides}
            onOverride={handleOverride}
          />
        ))}
      </div>

      {/* ── 商品登録ボタン ── */}
      <button
        onClick={handleRegisterFromCalc}
        className="w-full rounded-xl border border-blue-300 bg-blue-50 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition"
      >
        この情報で商品を新規登録 →
      </button>

      {/* ── クリアボタン群 ── */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">クリア</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={clearSellAll}
            className="rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            販売価格 クリア
          </button>
          <button
            onClick={() => setGlobalBuy('')}
            className="rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            仕入れ額 クリア
          </button>
          <button
            onClick={clearShipAll}
            className="rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            発送方法 クリア
          </button>
          <button
            onClick={clearPackAll}
            className="rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            梱包材費 クリア
          </button>
          <button
            onClick={clearAll}
            className="col-span-2 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-500 hover:bg-red-100 transition"
          >
            全てクリア
          </button>
        </div>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────
// ボトムナビ
// ─────────────────────────────────────────
function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
      <div className="flex max-w-md mx-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors relative',
                active ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600',
              ].join(' ')}
            >
              {tab.icon(active)}
              <span className={`text-[10px] font-medium ${active ? 'text-blue-500' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {active && <span className="absolute bottom-0 w-8 h-0.5 bg-blue-500 rounded-full" />}
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
  const [activeTab, setActiveTab] = useState('products')
  const [viewMode, setViewMode]   = useState(
    () => localStorage.getItem('product_view_mode') || 'list'
  )
  function handleViewModeChange(mode) {
    setViewMode(mode)
    localStorage.setItem('product_view_mode', mode)
  }

  const [loadedProduct, setLoadedProduct] = useState(null)

  function handleLoadToCalc(product) {
    setLoadedProduct(product)
    setActiveTab('calc')
  }

  function handleSwitchToProducts(callback) {
    setActiveTab('products')
    if (callback) setTimeout(callback, 50)
  }

  // calcState（商品管理のモーダルで「一括適用」に使う最低限の情報）
  const calcState = { sellPrice: '', buyPrice: '', platform: '', service: '', shipping: '', packCost: '' }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ヘッダー */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <h1 className="text-base font-bold text-gray-800 shrink-0">
            {activeTab === 'products' && '商品管理'}
            {activeTab === 'calc'     && '利益計算機'}
          </h1>
          {activeTab === 'products' && (
            <ViewModeToggle viewMode={viewMode} onChange={handleViewModeChange} />
          )}
          {activeTab === 'products' && loadedProduct && (
            <span className="rounded-full bg-blue-100 text-blue-600 text-xs font-semibold px-2.5 py-1 ml-auto truncate max-w-[140px]">
              計算機:「{loadedProduct.name}」
            </span>
          )}
        </div>
      </header>

      {/* メイン */}
      <main className="pb-24 pt-4 px-3">
        <div className={activeTab === 'products' ? 'block' : 'hidden'}>
          <ProductManager
            calcState={calcState}
            onLoadToCalc={handleLoadToCalc}
            addBtnId="product-manager-add-btn"
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
        </div>
        <div className={activeTab === 'calc' ? 'block' : 'hidden'}>
          <CalcPage
            loadedProduct={loadedProduct}
            setLoadedProduct={setLoadedProduct}
            onSwitchToProducts={handleSwitchToProducts}
          />
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
