import { useState } from 'react'
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
// 計算機ページ
// ─────────────────────────────────────────
function CalcPage({
  sellPrice, setSellPrice, buyPrice, setBuyPrice,
  platform, setPlatform, service, setService,
  shipping, setShipping, packCost, setPackCost,
  loadedProduct, setLoadedProduct, onSwitchToProducts,
}) {
  const currentServices = shippingOptions[platform]
  const selectedService = currentServices.find((s) => s.service === service) || null
  const currentOptions  = selectedService ? selectedService.options : []
  const selectedOption  = currentOptions.find((o) => o.value === shipping)
  const ship = selectedOption ? selectedOption.fee : 0

  const fee       = calcFee(Number(sellPrice) || 0, feeRate[platform])
  const profit    = calcProfit(Number(sellPrice) || 0, Number(buyPrice) || 0, fee, Number(ship) || 0, Number(packCost) || 0)
  const breakEven = calcBreakEven(Number(buyPrice) || 0, Number(ship) || 0, Number(packCost) || 0, feeRate[platform])
  const profitColor = profit > 0 ? 'text-blue-600' : profit < 0 ? 'text-red-500' : 'text-gray-400'

  function resetCalc() {
    setSellPrice(''); setBuyPrice(''); setPlatform('mercari')
    setService(''); setShipping(''); setPackCost('0'); setLoadedProduct(null)
  }

  function handleRegisterFromCalc() {
    onSwitchToProducts(() => {
      const el = document.getElementById('product-manager-add-btn')
      if (el) el.click()
    })
  }

  function handleUpdateLoadedProduct() {
    if (!loadedProduct) return
    const updated = {
      ...loadedProduct,
      sellPrice: sellPrice !== '' ? Number(sellPrice) : loadedProduct.sellPrice,
      buyPrice:  buyPrice  !== '' ? Number(buyPrice)  : loadedProduct.buyPrice,
      platform, service, shipping,
      packCost:  packCost  !== '' ? Number(packCost)  : loadedProduct.packCost,
    }
    const result = saveProduct(updated)
    if (result.success) { setLoadedProduct(updated); alert(`「${updated.name}」の情報を更新しました。`) }
    else alert(result.message)
  }

  function numericHandler(setter) {
    return (e) => {
      const val = e.target.value
      if (val === '' || /^[0-9]+$/.test(val)) setter(val === '' ? '' : Number(val))
    }
  }

  const ic = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-sm w-full p-6">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">利益計算機</h2>
          {loadedProduct && (
            <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-blue-500 font-semibold">編集中の商品</p>
                <p className="text-sm font-bold text-blue-800 mt-0.5">{loadedProduct.name}</p>
              </div>
              <button onClick={resetCalc} className="text-xs text-blue-400 hover:text-blue-600 underline shrink-0">解除</button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">プラットフォーム</label>
          <select className={ic} value={platform} onChange={(e) => { setPlatform(e.target.value); setService(''); setShipping('') }}>
            <option value="mercari">メルカリ（10%）</option>
            <option value="yahoo">Yahoo!フリマ（5%）</option>
            <option value="rakuma">ラクマ（10%）</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">配送サービス</label>
          <select className={ic} value={service} onChange={(e) => { setService(e.target.value); setShipping('') }}>
            <option value="">選択してください</option>
            {currentServices.map((s) => <option key={s.service} value={s.service}>{s.label}</option>)}
          </select>
        </div>

        {service && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">配送方法</label>
            <select className={ic} value={shipping} onChange={(e) => setShipping(e.target.value)}>
              <option value="">選択してください</option>
              {currentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}（{o.fee}円）</option>)}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">梱包材費（円）</label>
          <input type="text" inputMode="numeric" pattern="[0-9]*" className={ic} value={packCost} onChange={numericHandler(setPackCost)} placeholder="例：50" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">売値（円）</label>
          <input type="text" inputMode="numeric" pattern="[0-9]*" className={ic} value={sellPrice} onChange={numericHandler(setSellPrice)} placeholder="例：3000" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-1">仕入れ値（円）</label>
          <input type="text" inputMode="numeric" pattern="[0-9]*" className={ic} value={buyPrice} onChange={numericHandler(setBuyPrice)} placeholder="例：1000" />
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4">
          <div className="flex justify-between text-sm text-gray-600"><span>手数料</span><span>{Math.round(fee)} 円</span></div>
          <div className="flex justify-between text-sm text-gray-600"><span>送料</span><span>{ship} 円</span></div>
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
            <span className="text-gray-800">利益</span>
            <span className={profitColor}>{Math.round(profit)} 円</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>損益分岐点</span><span>{sellPrice ? breakEven : '---'} 円</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={handleRegisterFromCalc} className="w-full rounded-lg border border-blue-300 bg-blue-50 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition">
            この情報で商品を新規登録 →
          </button>
          {loadedProduct && (
            <button onClick={handleUpdateLoadedProduct} className="w-full rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition">
              「{loadedProduct.name}」の情報を更新して保存
            </button>
          )}
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

  // 表示モード（localStorage に永続保存）
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('product_view_mode') || 'list'
  )
  function handleViewModeChange(mode) {
    setViewMode(mode)
    localStorage.setItem('product_view_mode', mode)
  }

  // 計算機ステート
  const [sellPrice, setSellPrice]         = useState('')
  const [buyPrice, setBuyPrice]           = useState('')
  const [platform, setPlatform]           = useState('mercari')
  const [service, setService]             = useState('')
  const [shipping, setShipping]           = useState('')
  const [packCost, setPackCost]           = useState('0')
  const [loadedProduct, setLoadedProduct] = useState(null)

  const calcState = { sellPrice, buyPrice, platform, service, shipping, packCost }

  function handleLoadToCalc(product) {
    setSellPrice(product.sellPrice !== '' ? String(product.sellPrice) : '')
    setBuyPrice(product.buyPrice   !== '' ? String(product.buyPrice)  : '')
    setPackCost(product.packCost   !== '' ? String(product.packCost)  : '0')
    if (product.platform) {
      setPlatform(product.platform)
      setService(product.service   || '')
      setShipping(product.shipping || '')
    } else {
      setPlatform('mercari'); setService(''); setShipping('')
    }
    setLoadedProduct(product)
    setActiveTab('calc')
  }

  function handleSwitchToProducts(callback) {
    setActiveTab('products')
    if (callback) setTimeout(callback, 50)
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ヘッダー */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <h1 className="text-base font-bold text-gray-800 shrink-0">
            {activeTab === 'products' && '商品管理'}
            {activeTab === 'calc'     && '利益計算機'}
          </h1>

          {/* 商品管理タブのみ表示モード切り替えを表示 */}
          {activeTab === 'products' && (
            <ViewModeToggle viewMode={viewMode} onChange={handleViewModeChange} />
          )}

          {/* 計算機タブで商品ロード中バッジ */}
          {activeTab === 'products' && loadedProduct && (
            <span className="rounded-full bg-blue-100 text-blue-600 text-xs font-semibold px-2.5 py-1 ml-auto truncate max-w-[140px]">
              計算機:「{loadedProduct.name}」
            </span>
          )}
        </div>
      </header>

      {/* メイン */}
      <main className="pb-24 pt-4 px-4">
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
            sellPrice={sellPrice}   setSellPrice={setSellPrice}
            buyPrice={buyPrice}     setBuyPrice={setBuyPrice}
            platform={platform}     setPlatform={setPlatform}
            service={service}       setService={setService}
            shipping={shipping}     setShipping={setShipping}
            packCost={packCost}     setPackCost={setPackCost}
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
