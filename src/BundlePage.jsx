// BundlePage.jsx
// 複数商品をまとめて販売するときの価格計算・損益差表示
import { useState, useMemo, useEffect } from 'react'
import { getAllProducts } from './productStore'
import { saveSale } from './salesStore'
import { feeRate as defaultFeeRate, shippingOptions } from './constants'
import { calcFee, calcProfit } from './calc'
import { FeeBadge, feeLabel } from './feeConfig.jsx'

const MAX_BUNDLE = 5

const PLATFORM_META = {
  mercari:  { label: 'メルカリ',     color: 'bg-red-500',    light: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    dot: 'bg-red-500'    },
  yahoo:    { label: 'Yahoo!フリマ', color: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', dot: 'bg-purple-500' },
  rakuma:   { label: 'ラクマ',       color: 'bg-blue-900',   light: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   dot: 'bg-blue-900'   },
  yahuoku:  { label: 'ヤフオク',     color: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', dot: 'bg-orange-500' },
}
const PLATFORM_OPTIONS = Object.entries(PLATFORM_META).map(([k, v]) => ({ value: k, label: v.label }))

// ── 商品選択モーダル ──────────────────────────────────────
function ProductSelectModal({ selected, onSelect, onClose }) {
  const [products] = useState(() => getAllProducts())
  const [search, setSearch] = useState('')

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(p) {
    const isSelected = selected.some((s) => s.id === p.id)
    if (isSelected) {
      onSelect(selected.filter((s) => s.id !== p.id))
    } else {
      if (selected.length >= MAX_BUNDLE) return
      onSelect([...selected, p])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-t-2xl shadow-2xl overflow-hidden" style={{ maxHeight: '80vh' }}>
        <div className="bg-blue-500 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold">商品を選択</h2>
            <p className="text-blue-100 text-xs mt-0.5">{selected.length}/{MAX_BUNDLE}個選択中</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="商品名で検索..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="overflow-y-auto divide-y divide-gray-50" style={{ maxHeight: '50vh' }}>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">商品がありません</p>
          )}
          {filtered.map((p) => {
            const isSelected = selected.some((s) => s.id === p.id)
            const isDisabled = !isSelected && selected.length >= MAX_BUNDLE
            const thumb = p.images?.[0] || null
            return (
              <button
                key={p.id}
                onClick={() => toggle(p)}
                disabled={isDisabled}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 transition',
                  isSelected ? 'bg-blue-50' : isDisabled ? 'opacity-40' : 'hover:bg-gray-50',
                ].join(' ')}
              >
                {/* チェックボックス */}
                <div className={[
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition',
                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300',
                ].join(' ')}>
                  {isSelected && (
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M2 6l2.5 2.5L10 3" />
                    </svg>
                  )}
                </div>
                {/* サムネ */}
                {thumb
                  ? <img src={thumb} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  : <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                }
                {/* 情報 */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    仕入れ ¥{Number(p.buyPrice).toLocaleString()}
                    {p.sellPrice !== '' && ` / 売値 ¥${Number(p.sellPrice).toLocaleString()}`}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={selected.length === 0}
            className="w-full rounded-xl bg-blue-500 py-3 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {selected.length}個でまとめ売り計算する
          </button>
        </div>
      </div>
    </div>
  )
}

// ── まとめ売り 一括登録モーダル ──────────────────────────
// まとめ売り全体を1件として損益集計に登録する
function BundleSoldModal({ selected, bundlePlatform, soldDate, bundleSellPrice, bundleProfit, bundleFee, shipFee, packCostNum, feeRates, onSave, onClose }) {
  const [totalSell, setTotalSell] = useState(String(bundleSellPrice || ''))
  const [date, setDate]           = useState(soldDate)

  const totalBuy = selected.reduce((s, p) => s + (Number(p.buyPrice) || 0), 0)
  const sp       = Number(totalSell) || 0
  const rate     = feeRates?.[bundlePlatform] ?? defaultFeeRate[bundlePlatform] ?? 0
  const fee      = Math.round(sp * rate)
  const profit   = sp - totalBuy - fee - (Number(shipFee) || 0) - (Number(packCostNum) || 0)

  const names = selected.map((p) => p.name).join('、')

  function handleSave() {
    // まとめ売りを1件のレコードとして登録
    onSave({
      id:          crypto.randomUUID(),
      productId:   '',   // 複数商品のためIDなし
      productName: `【まとめ売り】${names}`,
      soldDate:    date,
      platform:    bundlePlatform,
      sellPrice:   sp,
      buyPrice:    totalBuy,
      fee,
      shippingFee: Number(shipFee) || 0,
      packCost:    Number(packCostNum) || 0,
      profit,
      isBundle:    true,    // まとめ売りフラグ
      bundleCount: selected.length,
    })
  }

  const ic = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
  const pColor = profit >= 0 ? 'text-emerald-600' : 'text-red-500'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-emerald-500 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold">まとめ売り 登録</h2>
            <p className="text-emerald-100 text-xs mt-0.5">{selected.length}商品 / 損益集計に1件で登録</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* 商品一覧（確認用） */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 space-y-1">
            {selected.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                <span className="text-gray-700 truncate flex-1">{p.name}</span>
                <span className="text-gray-400 shrink-0">¥{Number(p.buyPrice).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs pt-1 border-t border-gray-200 text-gray-500 font-semibold">
              <span>仕入れ合計</span>
              <span>¥{totalBuy.toLocaleString()}</span>
            </div>
          </div>

          {/* 売れた日付 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">売れた日付</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={ic} />
          </div>

          {/* 売上額 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">まとめ売り総額（円）</label>
            <input
              type="text" inputMode="numeric" value={totalSell}
              onChange={(e) => { if (e.target.value === '' || /^[0-9]+$/.test(e.target.value)) setTotalSell(e.target.value) }}
              placeholder="例：5000" className={ic}
            />
          </div>

          {/* リアルタイム損益プレビュー */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-500">純利益</span>
              <span className={`text-xl font-black ${pColor}`}>
                {profit >= 0 ? '+' : ''}{profit.toLocaleString()}円
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400">
              <span>手数料 ¥{fee.toLocaleString()}</span>
              <span>送料 ¥{Number(shipFee)||0}</span>
              <span>梱包 ¥{Number(packCostNum)||0}</span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 bg-blue-50 rounded-lg px-3 py-2">
            💡 損益集計モードに「【まとめ売り】」として1件で登録されます。販売件数は1件としてカウントされます。
          </p>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">キャンセル</button>
          <button onClick={handleSave} className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition">登録する</button>
        </div>
      </div>
    </div>
  )
}

// ── メインページ ──────────────────────────────────────────
export default function BundlePage({ feeRates, onFeeRatesChange }) {
  const [selected, setSelected]         = useState([])   // 選択商品
  const [showSelect, setShowSelect]     = useState(false)

  // まとめ売り条件
  const [platform,   setPlatform]   = useState('')
  const [service,    setService]    = useState('')
  const [shipping,   setShipping]   = useState('')
  const [packCost,   setPackCost]   = useState('')
  const [offerPrice, setOfferPrice] = useState('')  // 客の希望金額

  // 売れた！関連
  const [soldDate,       setSoldDate]     = useState(() => new Date().toISOString().slice(0, 10))
  const [showSoldModal,  setShowSoldModal] = useState(false)  // まとめ売り一括登録モーダル

  // プラットフォーム変更時リセット
  function handlePlatformChange(pf) {
    setPlatform(pf); setService(''); setShipping('')
  }
  function handleServiceChange(sv) {
    setService(sv); setShipping('')
  }

  const services    = platform ? shippingOptions[platform] || [] : []
  const svcObj      = services.find((s) => s.service === service) || null
  const isNonAnon   = svcObj ? svcObj.anonymous === false : false
  const shipOptions = svcObj?.options || []
  const shipObj     = shipOptions.find((o) => o.value === shipping)
  const shipFee     = isNonAnon ? 0 : (shipObj ? shipObj.fee : 0)
  const packCostNum = Number(packCost) || 0

  // 各商品の仕入れ合計
  const totalBuyPrice = useMemo(() =>
    selected.reduce((sum, p) => sum + (Number(p.buyPrice) || 0), 0), [selected])

  // 個別販売した場合の利益合計（各商品の sellPrice × 手数料率 で計算）
  const individualTotal = useMemo(() => {
    if (!platform) return null
    const rate = feeRates?.[platform] ?? defaultFeeRate[platform] ?? 0
    return selected.reduce((sum, p) => {
      const sp = Number(p.sellPrice) || 0
      if (sp === 0) return sum
      const fee = Math.round(sp * rate)
      const sf  = Number(p.selectedRoute?.shippingFee) || 0
      const pc  = Number(p.packCost) || 0
      return sum + (sp - (Number(p.buyPrice) || 0) - fee - sf - pc)
    }, 0)
  }, [selected, platform, feeRates])

  // まとめ売り価格（自動計算）：損益ゼロになる最低金額
  const rate = platform ? (feeRates?.[platform] ?? defaultFeeRate[platform] ?? 0) : 0
  const minBundlePrice = rate > 0
    ? Math.ceil((totalBuyPrice + shipFee + packCostNum) / (1 - rate))
    : 0

  // まとめ売り価格（実際に入力する販売額 → ここでは各商品のsellPrice合計をデフォルトとする）
  const suggestedBundlePrice = useMemo(() =>
    selected.reduce((sum, p) => sum + (Number(p.sellPrice) || 0), 0), [selected])

  // まとめ売り時の利益（提示価格 or 各商品売値合計を使用）
  const bundleSellPrice = offerPrice !== '' ? Number(offerPrice) : suggestedBundlePrice
  const bundleFee       = rate > 0 ? Math.round(bundleSellPrice * rate) : 0
  const bundleProfit    = bundleSellPrice - totalBuyPrice - bundleFee - shipFee - packCostNum

  // 差分
  const profitDiff = (individualTotal !== null)
    ? bundleProfit - individualTotal
    : null

  const meta = PLATFORM_META[platform] || null

  // 売れた！保存
  function handleSoldSave(sale) {
    saveSale(sale)
    setShowSoldModal(false)
  }

  const ic = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">

      {/* ── 商品選択エリア ── */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-800">まとめ売り計算</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">最大{MAX_BUNDLE}商品まで選択できます</p>
          </div>
          <button
            onClick={() => setShowSelect(true)}
            className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition"
          >
            {selected.length === 0 ? '＋ 商品を選ぶ' : `＋ 変更（${selected.length}/${MAX_BUNDLE}）`}
          </button>
        </div>

        {selected.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-400">商品が選択されていません</p>
            <p className="text-xs text-gray-300 mt-1">「商品を選ぶ」から登録済み商品を選択してください</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selected.map((p, i) => {
              const thumb = p.images?.[0] || null
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  {thumb
                    ? <img src={thumb} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    : <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">
                      仕入れ ¥{Number(p.buyPrice).toLocaleString()}
                      {p.sellPrice !== '' && ` / 売値 ¥${Number(p.sellPrice).toLocaleString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(selected.filter((s) => s.id !== p.id))}
                    className="text-gray-300 hover:text-red-400 transition text-lg leading-none shrink-0"
                  >
                    ×
                  </button>
                </div>
              )
            })}
            {/* 仕入れ合計 */}
            <div className="flex justify-between text-xs text-gray-500 px-1 pt-1 border-t border-gray-100">
              <span>仕入れ合計</span>
              <span className="font-bold text-gray-700">¥{totalBuyPrice.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── 発送・梱包設定 ── */}
      {selected.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500">まとめ売りの発送設定</p>

          {/* プラットフォーム */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">プラットフォーム</label>
            <div className="flex items-center gap-2">
              <select value={platform} onChange={(e) => handlePlatformChange(e.target.value)} className={ic}>
                <option value="">選択してください</option>
                {PLATFORM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {/* ラクマ選択時：手数料バッジ */}
              {platform && (
                <div className={`shrink-0 rounded-lg px-2 py-1.5 ${meta?.color || 'bg-gray-400'}`}>
                  <FeeBadge
                    platform={platform}
                    feeRate={feeRates?.[platform] ?? defaultFeeRate[platform] ?? 0}
                    onFeeChange={(val) => onFeeRatesChange?.({ ...feeRates, [platform]: val })}
                    dark={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 配送サービス */}
          {platform && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">配送サービス</label>
              <select value={service} onChange={(e) => handleServiceChange(e.target.value)} className={ic}>
                <option value="">選択してください</option>
                {services.map((s) => <option key={s.service} value={s.service}>{s.label}</option>)}
              </select>
            </div>
          )}

          {/* 配送方法 */}
          {service && !isNonAnon && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">配送方法</label>
              <select value={shipping} onChange={(e) => setShipping(e.target.value)} className={ic}>
                <option value="">選択してください</option>
                {shipOptions.map((o) => <option key={o.value} value={o.value}>{o.label}（{o.fee}円）</option>)}
              </select>
            </div>
          )}

          {/* 梱包材費 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">梱包材費（円）</label>
            <input
              type="text" inputMode="numeric" value={packCost}
              onChange={(e) => { if (e.target.value === '' || /^[0-9]+$/.test(e.target.value)) setPackCost(e.target.value) }}
              placeholder="0" className={ic}
            />
          </div>

          {/* 送料確認 */}
          {shipFee > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-600">
              送料：¥{shipFee.toLocaleString()}（{shipObj?.label}）
            </div>
          )}
        </div>
      )}

      {/* ── 計算結果 ── */}
      {selected.length > 0 && platform && (
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500">計算結果</p>

          {/* 各商品の売値合計 → まとめ売り推奨価格 */}
          <div className={`rounded-xl border ${meta?.border || 'border-gray-200'} px-4 py-3`}>
            <p className="text-[10px] text-gray-400 mb-1">まとめ売り推奨価格（各商品の売値合計）</p>
            <p className={`text-2xl font-black ${meta?.text || 'text-gray-700'}`}>
              ¥{suggestedBundlePrice.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              最低販売価格（損益±0）：¥{minBundlePrice.toLocaleString()}
            </p>
          </div>

          {/* 客の希望金額入力 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              客の希望金額（円）<span className="ml-1 text-[10px] text-gray-300 font-normal">任意：値下げ交渉額を入力</span>
            </label>
            <input
              type="text" inputMode="numeric" value={offerPrice}
              onChange={(e) => { if (e.target.value === '' || /^[0-9]+$/.test(e.target.value)) setOfferPrice(e.target.value) }}
              placeholder={`例：${Math.round(suggestedBundlePrice * 0.9).toLocaleString()}（1割引）`}
              className={ic}
            />
          </div>

          {/* 損益計算 */}
          <div className="space-y-2">
            {/* まとめ売り損益 */}
            <div className={`rounded-xl px-4 py-3 ${bundleProfit >= 0 ? (meta?.light || 'bg-gray-50') : 'bg-red-50'}`}>
              <p className="text-[10px] text-gray-500 mb-1">
                {offerPrice !== '' ? `希望金額（¥${Number(offerPrice).toLocaleString()}）での利益` : 'まとめ売り時の利益'}
              </p>
              <div className="flex items-end gap-2">
                <p className={`text-2xl font-black leading-none ${bundleProfit >= 0 ? (meta?.text || 'text-gray-700') : 'text-red-500'}`}>
                  {bundleProfit >= 0 ? '+' : ''}{bundleProfit.toLocaleString()}円
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400">
                <span>売上 ¥{bundleSellPrice.toLocaleString()}</span>
                <span>手数料 ¥{bundleFee.toLocaleString()}</span>
                <span>送料 ¥{shipFee.toLocaleString()}</span>
                <span>梱包 ¥{packCostNum.toLocaleString()}</span>
                <span>仕入れ ¥{totalBuyPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* 個別販売との比較 */}
            {individualTotal !== null && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                <p className="text-[10px] text-gray-400 mb-2">個別販売した場合との比較</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400">個別販売の利益合計</p>
                    <p className="text-base font-bold text-gray-700">
                      {individualTotal >= 0 ? '+' : ''}{individualTotal.toLocaleString()}円
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-300" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">まとめ売りの利益</p>
                    <p className={`text-base font-bold ${bundleProfit >= 0 ? (meta?.text || 'text-gray-700') : 'text-red-500'}`}>
                      {bundleProfit >= 0 ? '+' : ''}{bundleProfit.toLocaleString()}円
                    </p>
                  </div>
                </div>
                {/* 差分 */}
                <div className={`mt-2 pt-2 border-t border-gray-200 flex items-center justify-between`}>
                  <span className="text-xs text-gray-500">損益差（まとめ − 個別）</span>
                  <span className={`text-base font-black ${
                    profitDiff === 0 ? 'text-gray-400'
                    : profitDiff > 0 ? 'text-emerald-600'
                    : 'text-red-500'
                  }`}>
                    {profitDiff > 0 ? '+' : ''}{profitDiff?.toLocaleString()}円
                  </span>
                </div>
                {profitDiff !== null && profitDiff < 0 && (
                  <p className="text-[10px] text-red-400 mt-1">
                    ⚠ 個別販売より{Math.abs(profitDiff).toLocaleString()}円少ない利益になります
                  </p>
                )}
                {profitDiff !== null && profitDiff >= 0 && (
                  <p className="text-[10px] text-emerald-500 mt-1">
                    ✓ 個別販売より{profitDiff.toLocaleString()}円多い（または同等の）利益です
                  </p>
                )}
              </div>
            )}

            {/* 個別商品に売値未設定がある場合の注意 */}
            {selected.some((p) => !p.sellPrice || p.sellPrice === '') && (
              <p className="text-[10px] text-amber-500 bg-amber-50 rounded-lg px-3 py-2">
                ⚠ 売値が未設定の商品があるため、個別販売の比較が正確でない場合があります
              </p>
            )}
          </div>

          {/* ── 売れた！エリア ── */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500">売れた！登録</p>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">売れた日付</label>
              <input type="date" value={soldDate} onChange={(e) => setSoldDate(e.target.value)} className={ic} />
            </div>
            <p className="text-[10px] text-gray-400">
              まとめ売り全体を損益集計に1件として登録します。
            </p>
            <button
              onClick={() => setShowSoldModal(true)}
              className="w-full rounded-xl border border-emerald-300 bg-emerald-50 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition flex items-center justify-center gap-2"
            >
              🎉 まとめ売りで売れた！登録する
            </button>
          </div>
        </div>
      )}

      {/* 商品選択モーダル */}
      {showSelect && (
        <ProductSelectModal
          selected={selected}
          onSelect={setSelected}
          onClose={() => setShowSelect(false)}
        />
      )}

      {/* まとめ売り一括登録モーダル */}
      {showSoldModal && (
        <BundleSoldModal
          selected={selected}
          bundlePlatform={platform}
          soldDate={soldDate}
          bundleSellPrice={bundleSellPrice}
          bundleProfit={bundleProfit}
          bundleFee={bundleFee}
          shipFee={shipFee}
          packCostNum={packCostNum}
          feeRates={feeRates}
          onSave={handleSoldSave}
          onClose={() => setShowSoldModal(false)}
        />
      )}
    </div>
  )
}