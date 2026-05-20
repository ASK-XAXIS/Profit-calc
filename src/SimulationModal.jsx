// SimulationModal.jsx
import { useState, useMemo } from 'react'
import { buildSimulation, findBestRow } from './simulationEngine'
import { getSearchUrl, fetchMarketPrice } from './priceSearchAdapter'
import { RAKUMA_FEE_OPTIONS, feeLabel } from './feeConfig'

const PLATFORM_LABEL = {
  mercari: 'メルカリ',
  yahoo:   'Yahoo!フリマ',
  rakuma:  'ラクマ',
  yahuoku: 'ヤフオク',
}

const PLATFORM_STYLE = {
  mercari: { header: 'bg-red-500',    border: 'border-red-200',    rowBest: 'bg-red-50',    badge: 'bg-red-100 text-red-700',    radio: 'accent-red-500',    editBtn: 'text-red-600 underline decoration-dotted hover:opacity-70' },
  yahoo:   { header: 'bg-purple-500', border: 'border-purple-200', rowBest: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700', radio: 'accent-purple-500', editBtn: 'text-purple-600 underline decoration-dotted hover:opacity-70' },
  rakuma:  { header: 'bg-pink-500',   border: 'border-pink-200',   rowBest: 'bg-pink-50',   badge: 'bg-pink-100 text-pink-700',   radio: 'accent-pink-500',   editBtn: 'text-pink-600 underline decoration-dotted hover:opacity-70' },
  yahuoku: { header: 'bg-orange-500', border: 'border-orange-200', rowBest: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700', radio: 'accent-orange-500', editBtn: 'text-orange-600 underline decoration-dotted hover:opacity-70' },
}

// ── 相場検索ボタン ────────────────────────────────────────
function MarketSearchButton({ productName, platform, onPriceFound }) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    try {
      const price = await fetchMarketPrice(productName, platform)
      if (price !== null) { onPriceFound(price) }
      else { window.open(getSearchUrl(productName, platform), '_blank', 'noopener') }
    } finally { setLoading(false) }
  }
  return (
    <button onClick={handle} disabled={loading}
      className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-white/70 text-gray-500 hover:bg-white border border-gray-200 transition disabled:opacity-50 whitespace-nowrap">
      {loading ? '…' : '相場検索'}
    </button>
  )
}

// ── 手数料バッジ（ラクマのみタップでプルダウン） ──────────
function FeeBadge({ platform, feeRate, onFeeChange }) {
  const [open, setOpen] = useState(false)
  const isRakuma    = platform === 'rakuma'
  const isChanged   = isRakuma && feeRate !== 0.10

  if (!isRakuma) {
    // ラクマ以外は固定表示
    return (
      <span className="text-white/80 text-[10px] font-semibold bg-white/20 rounded px-1.5 py-0.5">
        {feeLabel(feeRate)}
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          'flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold transition',
          isChanged
            ? 'bg-yellow-300 text-yellow-900 hover:bg-yellow-200'
            : 'bg-white/20 text-white hover:bg-white/30',
        ].join(' ')}
        title="タップして手数料率を変更"
      >
        {feeLabel(feeRate)}
        <svg viewBox="0 0 10 10" fill="currentColor" className="w-2 h-2 shrink-0">
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-[70] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[150px]">
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">ラクマ手数料率</p>
            </div>
            {RAKUMA_FEE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onFeeChange(opt.value); setOpen(false) }}
                className={[
                  'w-full flex items-center justify-between px-3 py-2 text-sm transition',
                  feeRate === opt.value
                    ? 'bg-pink-50 text-pink-700 font-bold'
                    : 'text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                <span>{opt.label}</span>
                {feeRate === opt.value && (
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-pink-500" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 8l3.5 3.5L13 4" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── プラットフォーム列 ────────────────────────────────────
function PlatformColumn({
  platform, rows, bestKey, feeRate, onFeeChange,
  sellPrice, onSellPriceChange,
  productName, selectedKey, onSelectRow,
}) {
  const s = PLATFORM_STYLE[platform]
  const [isEditing, setIsEditing] = useState(false)
  const [inputVal, setInputVal]   = useState(String(sellPrice))

  useMemo(() => { setInputVal(String(sellPrice)) }, [sellPrice])

  function commitEdit() {
    const n = Number(inputVal)
    if (!isNaN(n) && n >= 0) onSellPriceChange(platform, n)
    setIsEditing(false)
  }

  if (rows.length === 0) return null

  return (
    <div className={`flex flex-col border ${s.border} rounded-xl overflow-hidden min-w-0`}>

      {/* カラムヘッダー */}
      <div className={`${s.header} px-3 py-2.5`}>
        <div className="flex items-center justify-between gap-1">
          <p className="font-bold text-sm text-white">{PLATFORM_LABEL[platform]}</p>
          {/* 手数料バッジ（ラクマのみタップで変更可） */}
          <FeeBadge platform={platform} feeRate={feeRate} onFeeChange={onFeeChange} />
        </div>

        {/* 販売額編集 */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          <span className="text-white/70 text-[10px]">販売額</span>
          {isEditing ? (
            <div className="flex items-center gap-0.5">
              <input autoFocus type="text" inputMode="numeric" value={inputVal}
                onChange={(e) => { if (e.target.value === '' || /^[0-9]+$/.test(e.target.value)) setInputVal(e.target.value) }}
                onBlur={commitEdit}
                onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                className="w-16 rounded border border-white/50 bg-white/20 px-1.5 py-0.5 text-xs text-white text-right focus:outline-none focus:bg-white/30"
              />
              <span className="text-white/70 text-[10px]">円</span>
            </div>
          ) : (
            <button onClick={() => { setInputVal(String(sellPrice)); setIsEditing(true) }}
              className={`text-xs font-bold text-white ${s.editBtn}`}>
              ¥{sellPrice.toLocaleString()}
            </button>
          )}
          <MarketSearchButton productName={productName} platform={platform}
            onPriceFound={(price) => { onSellPriceChange(platform, price); setInputVal(String(price)) }} />
        </div>
      </div>

      {/* 行ヘッダー */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-1 px-2 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
        <span className="w-4" />
        <span>配送方法</span>
        <span className="text-right">利益</span>
      </div>

      {/* 行リスト */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {rows.map((row, i) => {
          const key          = `${row.platform}-${row.shippingValue}`
          const isGlobalBest = key === bestKey
          const isSelected   = key === selectedKey

          return (
            <label key={i}
              className={[
                'grid grid-cols-[auto_1fr_auto] items-center gap-x-2 px-2 py-2 cursor-pointer transition',
                isSelected ? 'bg-blue-50' : isGlobalBest ? s.rowBest : 'hover:bg-gray-50',
              ].join(' ')}
            >
              <input type="radio" name="selected-route" value={key} checked={isSelected}
                onChange={() => onSelectRow(row)}
                className={`w-3.5 h-3.5 ${s.radio} cursor-pointer`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${s.badge} leading-tight`}>
                    {row.serviceLabel}
                  </span>
                  {isGlobalBest && (
                    <span className="rounded-full bg-yellow-400 text-yellow-900 px-1.5 py-0.5 text-[9px] font-bold leading-tight">
                      ★ おすすめ
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-700 mt-0.5 leading-snug">{row.shippingLabel}</p>
                <p className="text-[10px] text-gray-400">送料 {row.shippingFee}円</p>
              </div>
              <div className={`text-right text-xs font-bold whitespace-nowrap ${
                row.profit > 0
                  ? isGlobalBest ? 'text-yellow-600' : isSelected ? 'text-blue-600' : 'text-emerald-600'
                  : row.profit < 0 ? 'text-red-500' : 'text-gray-400'
              }`}>
                {row.profit > 0 ? '+' : ''}{row.profit.toLocaleString()}
                <span className="font-normal text-[9px] ml-0.5">円</span>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

// ── メインモーダル ─────────────────────────────────────────
export default function SimulationModal({ product, feeRates, onFeeRatesChange, onClose, onSaveRoute }) {
  const [packCost, setPackCost] = useState(
    product.packCost !== '' && product.packCost !== undefined ? String(product.packCost) : '0'
  )

  const initSellPrice = product.sellPrice !== '' && product.sellPrice !== undefined
    ? Number(product.sellPrice) : 0

  const [sellPrices, setSellPrices] = useState({
    mercari: initSellPrice, yahoo: initSellPrice, rakuma: initSellPrice, yahuoku: initSellPrice,
  })

  const [selectedRow, setSelectedRow] = useState(null)

  function updateSellPrice(platform, price) {
    setSellPrices((prev) => ({ ...prev, [platform]: price }))
  }

  // ラクマ手数料変更（親の onFeeRatesChange を呼んで全体に反映）
  function handleFeeChange(platform, val) {
    if (onFeeRatesChange) onFeeRatesChange({ ...feeRates, [platform]: val })
  }

  const allRows = useMemo(() => buildSimulation({
    sellPriceOverrides: sellPrices,
    buyPrice:  product.buyPrice,
    packCost,
    thickness: product.thickness,
    feeRates,                        // ← 常に最新の手数料率で計算
  }), [sellPrices, product.buyPrice, packCost, product.thickness, feeRates])

  const bestRow     = useMemo(() => findBestRow(allRows), [allRows])
  const bestKey     = bestRow ? `${bestRow.platform}-${bestRow.shippingValue}` : null
  const selectedKey = selectedRow ? `${selectedRow.platform}-${selectedRow.shippingValue}` : null

  const grouped = useMemo(() => {
    const g = {}
    for (const row of allRows) {
      if (!g[row.platform]) g[row.platform] = []
      g[row.platform].push(row)
    }
    return g
  }, [allRows])

  const platforms = ['mercari', 'yahoo', 'rakuma', 'yahuoku']

  function handleSaveRoute() {
    if (!selectedRow) return
    onSaveRoute({
      platform: selectedRow.platform, service: selectedRow.service,
      shipping: selectedRow.shippingValue, shippingFee: selectedRow.shippingFee,
      sellPrice: selectedRow.sellPrice, profit: selectedRow.profit,
      serviceLabel: selectedRow.serviceLabel, shippingLabel: selectedRow.shippingLabel,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-3 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl my-4 overflow-hidden flex flex-col">

        {/* ヘッダー */}
        <div className="bg-blue-500 px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-white font-bold text-base leading-snug">プラットフォーム別販売損益シミュレーション</h2>
            <p className="text-blue-100 text-xs mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none shrink-0">×</button>
        </div>

        {/* 基本情報バー */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] text-gray-400 block">仕入れ値</span>
            <span className="text-sm font-bold text-gray-800">¥{Number(product.buyPrice).toLocaleString()}</span>
          </div>
          {product.thickness !== '' && product.thickness !== undefined && (
            <div>
              <span className="text-[10px] text-gray-400 block">厚み</span>
              <span className="text-sm font-bold text-gray-800">{product.thickness} cm</span>
            </div>
          )}
          {feeRates && feeRates.rakuma !== 0.10 && (
            <div>
              <span className="text-[10px] text-gray-400 block">ラクマ手数料</span>
              <span className="text-sm font-bold text-amber-600">
                {feeLabel(feeRates.rakuma)}
                <span className="ml-1 text-[10px] font-normal text-amber-500">（変更中）</span>
              </span>
            </div>
          )}
          <div className="ml-auto">
            <label className="text-[10px] text-gray-400 block mb-1">梱包材費（円）</label>
            <input type="text" inputMode="numeric" value={packCost}
              onChange={(e) => { if (e.target.value === '' || /^[0-9]+$/.test(e.target.value)) setPackCost(e.target.value) }}
              className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* 厚み未入力警告 */}
        {(!product.thickness || product.thickness === '') && (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
            <p className="text-xs text-amber-700">⚠ 厚みが未登録のため全発送方法を表示中。商品編集で厚みを登録すると絞り込まれます。</p>
          </div>
        )}

        {/* おすすめサマリ */}
        {bestRow && (
          <div className="px-5 py-2.5 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2 shrink-0">
            <span className="text-base shrink-0">★</span>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-yellow-700 block">最もお得な組み合わせ</span>
              <span className="text-xs font-semibold text-yellow-800 truncate block">
                {PLATFORM_LABEL[bestRow.platform]} ／ {bestRow.serviceLabel} ／ {bestRow.shippingLabel}
                &ensp;→&ensp;<span className="text-sm font-bold">+{bestRow.profit.toLocaleString()}円</span>
              </span>
            </div>
          </div>
        )}

        {/* ヒント */}
        <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 shrink-0">
          <p className="text-[10px] text-blue-500">
            💡 ラジオボタンで販売ルートを選択 → 「この販売ルートで登録」で保存。ラクマの手数料率はヘッダーの%をタップして変更できます。
          </p>
        </div>

        {/* 4カラム横展開 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-4 h-full" style={{ minWidth: '700px' }}>
              {platforms.map((pf) => (
                <PlatformColumn
                  key={pf}
                  platform={pf}
                  rows={grouped[pf] || []}
                  bestKey={bestKey}
                  feeRate={feeRates ? feeRates[pf] : 0.10}
                  onFeeChange={(val) => handleFeeChange(pf, val)}
                  sellPrice={sellPrices[pf]}
                  onSellPriceChange={updateSellPrice}
                  productName={product.name}
                  selectedKey={selectedKey}
                  onSelectRow={setSelectedRow}
                />
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            {selectedRow ? (
              <div className="text-xs text-gray-600">
                <span className="font-semibold text-gray-800">{PLATFORM_LABEL[selectedRow.platform]}</span>
                {' ／ '}{selectedRow.serviceLabel}{' ／ '}{selectedRow.shippingLabel}{' '}
                <span className="font-bold text-blue-600">+{selectedRow.profit.toLocaleString()}円</span>
              </div>
            ) : (
              <p className="text-xs text-gray-400">ラジオボタンで販売ルートを選択してください</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition">閉じる</button>
            <button onClick={handleSaveRoute} disabled={!selectedRow}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition">
              この販売ルートで登録
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
