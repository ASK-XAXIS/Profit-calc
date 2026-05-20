import { useState, useEffect, useRef } from 'react'
import {
  getAllProducts,
  saveProduct,
  deleteProduct,
  createEmptyProduct,
} from './productStore'
import { shippingOptions } from './constants'
import SimulationModal from './SimulationModal'
import { RAKUMA_FEE_OPTIONS, feeLabel } from './feeConfig.jsx'

const MAX_PRODUCTS  = 100
const MAX_IMAGES    = 10
const VIEW_MODE_KEY = 'product_view_mode'

const PLATFORM_LABEL = {
  mercari: 'メルカリ',
  yahoo:   'Yahoo!フリマ',
  rakuma:  'ラクマ',
}
const PLATFORM_BADGE = {
  mercari: 'bg-red-100 text-red-700 border-red-200',
  yahoo:   'bg-purple-100 text-purple-700 border-purple-200',
  rakuma:  'bg-pink-100 text-pink-700 border-pink-200',
}

// ─────────────────────────────────────────
// 表示モードアイコン（ヘッダーで使用）
// ─────────────────────────────────────────
export function ViewModeToggle({ viewMode, onChange }) {
  const modes = [
    {
      id: 'list',
      label: 'リスト',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <rect x="2" y="3" width="6" height="6" rx="1" />
          <rect x="10" y="4" width="8" height="1.5" rx="0.75" />
          <rect x="10" y="7" width="5" height="1.5" rx="0.75" />
          <rect x="2" y="11" width="6" height="6" rx="1" />
          <rect x="10" y="12" width="8" height="1.5" rx="0.75" />
          <rect x="10" y="15" width="5" height="1.5" rx="0.75" />
        </svg>
      ),
    },
    {
      id: 'grid3thumb',
      label: 'グリッド',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <rect x="2"  y="2"  width="5" height="5" rx="1" />
          <rect x="7.5" y="2"  width="5" height="5" rx="1" />
          <rect x="13" y="2"  width="5" height="5" rx="1" />
          <rect x="2"  y="8"  width="5" height="5" rx="1" />
          <rect x="7.5" y="8"  width="5" height="5" rx="1" />
          <rect x="13" y="8"  width="5" height="5" rx="1" />
          <rect x="2"  y="14" width="5" height="5" rx="1" />
          <rect x="7.5" y="14" width="5" height="5" rx="1" />
          <rect x="13" y="14" width="5" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'grid3',
      label: 'コンパクト',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <rect x="2"  y="3"  width="5" height="4" rx="1" />
          <rect x="7.5" y="3"  width="5" height="4" rx="1" />
          <rect x="13" y="3"  width="5" height="4" rx="1" />
          <rect x="2"  y="8"  width="5" height="4" rx="1" />
          <rect x="7.5" y="8"  width="5" height="4" rx="1" />
          <rect x="13" y="8"  width="5" height="4" rx="1" />
          <rect x="2"  y="13" width="5" height="4" rx="1" />
          <rect x="7.5" y="13" width="5" height="4" rx="1" />
          <rect x="13" y="13" width="5" height="4" rx="1" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          title={m.label}
          className={[
            'rounded-md p-1.5 transition',
            viewMode === m.id
              ? 'bg-white text-blue-500 shadow-sm'
              : 'text-gray-400 hover:text-gray-600',
          ].join(' ')}
        >
          {m.icon}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────
// 画像アップロードエリア（フォーム内）
// ─────────────────────────────────────────
function ImageUploader({ images, onChange }) {
  const fileRef = useRef(null)

  async function handleFiles(files) {
    const arr = Array.from(files).slice(0, MAX_IMAGES - images.length)
    const results = await Promise.all(arr.map(fileToBase64))
    onChange([...images, ...results].slice(0, MAX_IMAGES))
  }

  function fileToBase64(file) {
    return new Promise((resolve) => {
      // 長辺800pxにリサイズしてから保存（容量節約）
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const MAX = 800
          let { width, height } = img
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX }
            else                { width  = Math.round(width  * MAX / height); height = MAX }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  function removeImage(idx) {
    onChange(images.filter((_, i) => i !== idx))
  }

  function moveLeft(idx) {
    if (idx === 0) return
    const arr = [...images]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    onChange(arr)
  }

  function moveRight(idx) {
    if (idx === images.length - 1) return
    const arr = [...images]
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    onChange(arr)
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">
          商品画像 <span className="text-gray-400 font-normal">({images.length}/{MAX_IMAGES}枚)</span>
        </span>
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs text-blue-500 font-semibold hover:text-blue-600 transition"
          >
            ＋ 追加
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* ドロップゾーン（画像なし時） */}
      {images.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M12 3.75v8.25m0 0l-3-3m3 3l3-3" />
          </svg>
          <p className="text-xs text-gray-400">タップして画像を選択、またはドロップ</p>
          <p className="text-[10px] text-gray-300">最大{MAX_IMAGES}枚・自動リサイズ</p>
        </div>
      )}

      {/* 画像プレビューグリッド */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((src, idx) => (
            <div key={idx} className="relative group aspect-square">
              <img
                src={src}
                alt={`商品画像${idx + 1}`}
                className={`w-full h-full object-cover rounded-lg ${idx === 0 ? 'ring-2 ring-blue-400' : ''}`}
              />
              {/* 1枚目バッジ */}
              {idx === 0 && (
                <span className="absolute top-0.5 left-0.5 rounded text-[9px] font-bold bg-blue-500 text-white px-1 leading-tight py-0.5">
                  表紙
                </span>
              )}
              {/* 操作オーバーレイ */}
              <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="rounded-full bg-red-500 text-white w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                >
                  ×
                </button>
                <div className="flex gap-1">
                  {idx > 0 && (
                    <button type="button" onClick={() => moveLeft(idx)} className="rounded bg-white/80 text-gray-700 px-1 text-xs hover:bg-white">←</button>
                  )}
                  {idx < images.length - 1 && (
                    <button type="button" onClick={() => moveRight(idx)} className="rounded bg-white/80 text-gray-700 px-1 text-xs hover:bg-white">→</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* 追加ボタン（グリッド内） */}
          {images.length < MAX_IMAGES && (
            <div
              onClick={() => fileRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <span className="text-2xl text-gray-300">＋</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// 商品フォームモーダル
// ─────────────────────────────────────────
function FieldLabel({ label, required }) {
  return (
    <label className="block text-sm font-medium text-gray-600 mb-1">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}

function ProductFormModal({ product: initial, onSave, onClose, calcState, feeRates, onFeeRatesChange }) {
  const [p, setP] = useState(initial)
  const [errors, setErrors] = useState({})

  const currentServices = p.platform ? shippingOptions[p.platform] || [] : []
  const selectedService  = currentServices.find((s) => s.service === p.service) || null
  const currentOptions   = selectedService ? selectedService.options : []

  function set(key, value) { setP((prev) => ({ ...prev, [key]: value })) }

  function numericChange(key) {
    return (e) => {
      const val = e.target.value
      if (val === '' || /^[0-9]+(\.[0-9]*)?$/.test(val)) set(key, val)
    }
  }

  function handlePlatformChange(val) {
    setP((prev) => ({ ...prev, platform: val, service: '', shipping: '' }))
  }
  function handleServiceChange(val) {
    setP((prev) => ({ ...prev, service: val, shipping: '' }))
  }

  function validate() {
    const e = {}
    if (!p.name.trim()) e.name = '商品名を入力してください'
    if (p.stock === '' || Number(p.stock) < 0) e.stock = '在庫数を0以上で入力してください'
    if (p.buyPrice === '' || isNaN(Number(p.buyPrice))) e.buyPrice = '仕入れ値を入力してください'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    const result = onSave({
      ...p,
      stock:     Number(p.stock),
      buyPrice:  Number(p.buyPrice),
      sellPrice: p.sellPrice !== '' ? Number(p.sellPrice) : '',
      thickness: p.thickness !== '' ? Number(p.thickness) : '',
      packCost:  p.packCost  !== '' ? Number(p.packCost)  : '',
      images:    p.images    || [],
    })
    if (result && !result.success) setErrors({ global: result.message })
  }

  function applyCalcState() {
    setP((prev) => ({
      ...prev,
      sellPrice: calcState.sellPrice !== '' ? String(calcState.sellPrice) : prev.sellPrice,
      buyPrice:  calcState.buyPrice  !== '' ? String(calcState.buyPrice)  : prev.buyPrice,
      platform:  calcState.platform  || prev.platform,
      service:   calcState.service   || prev.service,
      shipping:  calcState.shipping  || prev.shipping,
      packCost:  calcState.packCost  !== '' ? String(calcState.packCost) : prev.packCost,
    }))
  }

  const isEdit = !!initial.createdAt
  const hasCalcData = calcState &&
    (calcState.sellPrice !== '' || calcState.buyPrice !== '' ||
     calcState.platform  || calcState.service || calcState.packCost !== '')

  const ic = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        <div className="bg-blue-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{isEdit ? '商品を編集' : '商品を追加'}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>

        {!isEdit && hasCalcData && (
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-blue-700">計算機に入力済みの情報があります</p>
            <button onClick={applyCalcState} className="shrink-0 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition">
              一括適用
            </button>
          </div>
        )}

        <div className="px-6 py-5 max-h-[68vh] overflow-y-auto space-y-4">
          {errors.global && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errors.global}</p>
          )}

          {/* ── 画像 ── */}
          <ImageUploader
            images={p.images || []}
            onChange={(imgs) => set('images', imgs)}
          />

          <div className="border-t border-gray-100" />

          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest">必須情報</p>

          <div>
            <FieldLabel label="商品名" required />
            <input type="text" value={p.name} onChange={(e) => set('name', e.target.value)} placeholder="例：ヴィンテージTシャツ" className={ic} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <FieldLabel label="在庫数" required />
            <input type="text" inputMode="numeric" value={p.stock} onChange={numericChange('stock')} placeholder="例：1" className={ic} />
            {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
          </div>

          <div>
            <FieldLabel label="仕入れ値（円）" required />
            <input type="text" inputMode="numeric" value={p.buyPrice} onChange={numericChange('buyPrice')} placeholder="例：500" className={ic} />
            {errors.buyPrice && <p className="text-xs text-red-500 mt-1">{errors.buyPrice}</p>}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest pt-2">任意情報</p>

          <div>
            <FieldLabel label="売値（円）" />
            <div className="flex gap-2">
              <input type="text" inputMode="numeric" value={p.sellPrice} onChange={numericChange('sellPrice')} placeholder="未入力" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              {calcState?.sellPrice !== '' && calcState?.sellPrice !== undefined && (
                <button onClick={() => set('sellPrice', String(calcState.sellPrice))} className="shrink-0 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition whitespace-nowrap">
                  ¥{Number(calcState.sellPrice).toLocaleString()} を適用
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">計算機の売値で売れた場合に入力</p>
          </div>

          <div>
            <FieldLabel label="プラットフォーム" />
            <select value={p.platform} onChange={(e) => handlePlatformChange(e.target.value)} className={ic}>
              <option value="">選択してください</option>
              <option value="mercari">メルカリ（10%）</option>
              <option value="yahoo">Yahoo!フリマ（5%）</option>
              <option value="rakuma">ラクマ（{feeLabel(feeRates?.rakuma ?? 0.10)}）</option>
            </select>
          </div>

          {/* ラクマ選択時のみ手数料率変更セレクト */}
          {p.platform === 'rakuma' && (
            <div>
              <FieldLabel label="ラクマ手数料率" />
              <select
                value={feeRates?.rakuma ?? 0.10}
                onChange={(e) => onFeeRatesChange?.({ ...feeRates, rakuma: Number(e.target.value) })}
                className={ic}
              >
                {RAKUMA_FEE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">全領域に即時反映されます</p>
            </div>
          )}

          {p.platform && (
            <div>
              <FieldLabel label="配送サービス" />
              <select value={p.service} onChange={(e) => handleServiceChange(e.target.value)} className={ic}>
                <option value="">選択してください</option>
                {currentServices.map((s) => <option key={s.service} value={s.service}>{s.label}</option>)}
              </select>
            </div>
          )}

          {p.service && currentOptions.length > 0 && (
            <div>
              <FieldLabel label="配送方法" />
              <select value={p.shipping} onChange={(e) => set('shipping', e.target.value)} className={ic}>
                <option value="">選択してください</option>
                {currentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}（{o.fee}円）</option>)}
              </select>
            </div>
          )}

          <div>
            <FieldLabel label="梱包材費（円）" />
            <div className="flex gap-2">
              <input type="text" inputMode="numeric" value={p.packCost} onChange={numericChange('packCost')} placeholder="例：50" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              {calcState?.packCost !== '' && calcState?.packCost !== undefined && (
                <button onClick={() => set('packCost', String(calcState.packCost))} className="shrink-0 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition whitespace-nowrap">
                  {Number(calcState.packCost)}円 を適用
                </button>
              )}
            </div>
          </div>

          <div>
            <FieldLabel label="登録年月日" />
            <input type="date" value={p.registeredDate} onChange={(e) => set('registeredDate', e.target.value)} className={ic} />
          </div>

          <div>
            <FieldLabel label="売れた年月日" />
            <input type="date" value={p.soldDate} onChange={(e) => set('soldDate', e.target.value)} className={ic} />
          </div>

          <div>
            <FieldLabel label="商品の厚み（cm）" />
            <input type="text" inputMode="decimal" value={p.thickness} onChange={numericChange('thickness')} placeholder="例：2.5" className={ic} />
            <p className="text-xs text-gray-400 mt-1">シミュレーションの発送方法絞り込みに使用されます</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-5 py-2 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition">キャンセル</button>
          <button onClick={handleSave} className="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">保存する</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// サムネイルコンポーネント
// ─────────────────────────────────────────
function Thumbnail({ src, size = 'md' }) {
  const sizeClass = {
    sm: 'w-full aspect-square',
    md: 'w-16 h-16 shrink-0',
  }[size]

  if (!src) {
    return (
      <div className={`${sizeClass} rounded-lg bg-gray-100 flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="w-6 h-6 text-gray-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18" />
        </svg>
      </div>
    )
  }
  return <img src={src} alt="商品" className={`${sizeClass} rounded-lg object-cover`} />
}

// ─────────────────────────────────────────
// 商品カード — リスト表示（サムネ付き1列）
// ─────────────────────────────────────────
function CardList({ product, onEdit, onDelete, onLoadToCalc, onSimulate }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const route      = product.selectedRoute || null
  const routeBadge = route ? PLATFORM_BADGE[route.platform] : ''
  const thumb      = product.images?.[0] || null

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-3 flex gap-3">
      {/* サムネイル */}
      <Thumbnail src={thumb} size="md" />

      {/* 本文 */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* 商品名 + ボタン */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-sm truncate">{product.name}</p>
            <p className="text-xs text-gray-400">在庫 <span className="font-semibold text-gray-600">{product.stock}</span></p>
          </div>
          <div className="flex gap-1 shrink-0 flex-wrap justify-end">
            <button onClick={() => onLoadToCalc(product)} className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-100 transition">計算機</button>
            <button onClick={onEdit} className="rounded border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 transition">編集</button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="rounded border border-gray-200 px-2 py-0.5 text-[10px] text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">削除</button>
            ) : (
              <>
                <button onClick={onDelete} className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-600 transition">確認</button>
                <button onClick={() => setConfirmDelete(false)} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 transition">戻る</button>
              </>
            )}
          </div>
        </div>

        {/* 価格 */}
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="text-gray-400">仕入れ <span className="text-gray-700 font-semibold">¥{Number(product.buyPrice).toLocaleString()}</span></span>
          {product.sellPrice !== '' && <span className="text-gray-400">売値 <span className="text-blue-600 font-semibold">¥{Number(product.sellPrice).toLocaleString()}</span></span>}
        </div>

        {/* 販売ルート */}
        {route && (
          <div className={`rounded px-2 py-1 text-[10px] border ${routeBadge} flex gap-1.5 flex-wrap items-center`}>
            <span className="font-bold">{PLATFORM_LABEL[route.platform]}</span>
            <span className="text-gray-500">{route.shippingLabel}</span>
            <span className={`font-bold ml-auto ${route.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {route.profit >= 0 ? '+' : ''}{route.profit.toLocaleString()}円
            </span>
          </div>
        )}

        {/* シミュレーションボタン */}
        <button onClick={() => onSimulate(product)} className="w-full rounded border border-amber-200 bg-amber-50 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 transition flex items-center justify-center gap-1">
          📊 損益シミュレーション
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 商品カード — グリッド3列・サムネ付き
// ─────────────────────────────────────────
function CardGrid3Thumb({ product, onEdit, onDelete, onLoadToCalc, onSimulate }) {
  const [showMenu, setShowMenu] = useState(false)
  const route = product.selectedRoute || null
  const thumb = product.images?.[0] || null

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* サムネ */}
      <div className="relative aspect-square bg-gray-50">
        <Thumbnail src={thumb} size="sm" />
        {/* メニューボタン */}
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/30 text-white flex items-center justify-center text-xs hover:bg-black/50 transition"
        >
          ⋯
        </button>
        {/* ドロップダウンメニュー */}
        {showMenu && (
          <div className="absolute top-7 right-1 z-10 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden min-w-[80px]">
            <button onClick={() => { onLoadToCalc(product); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">計算機</button>
            <button onClick={() => { onEdit(); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">編集</button>
            <button onClick={() => { onSimulate(product); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50">シミュレーション</button>
            <button onClick={() => { onDelete(); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 border-t border-gray-100">削除</button>
          </div>
        )}
      </div>

      {/* 情報 */}
      <div className="px-2 py-2 flex flex-col gap-1">
        <p className="font-semibold text-gray-800 text-xs leading-snug line-clamp-2">{product.name}</p>
        <p className="text-[10px] text-gray-400">在庫 <span className="font-semibold text-gray-600">{product.stock}</span></p>
        <p className="text-[10px] text-gray-500">¥{Number(product.buyPrice).toLocaleString()}</p>
        {route && (
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${PLATFORM_BADGE[route.platform]} truncate`}>
            {PLATFORM_LABEL[route.platform]} {route.profit >= 0 ? '+' : ''}{route.profit.toLocaleString()}円
          </span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 商品カード — グリッド3列・サムネなし
// ─────────────────────────────────────────
function CardGrid3({ product, onEdit, onDelete, onLoadToCalc, onSimulate }) {
  const [showMenu, setShowMenu] = useState(false)
  const route = product.selectedRoute || null

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-2.5 py-2.5 flex flex-col gap-1.5 relative">
      {/* メニューボタン */}
      <button
        onClick={() => setShowMenu((v) => !v)}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs hover:bg-gray-200 transition"
      >
        ⋯
      </button>
      {showMenu && (
        <div className="absolute top-6 right-1 z-10 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden min-w-[80px]">
          <button onClick={() => { onLoadToCalc(product); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">計算機</button>
          <button onClick={() => { onEdit(); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">編集</button>
          <button onClick={() => { onSimulate(product); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50">シミュレーション</button>
          <button onClick={() => { onDelete(); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 border-t border-gray-100">削除</button>
        </div>
      )}

      <p className="font-semibold text-gray-800 text-xs leading-snug pr-5 line-clamp-2">{product.name}</p>
      <p className="text-[10px] text-gray-400">在庫 <span className="font-semibold text-gray-600">{product.stock}</span></p>
      <p className="text-[10px] text-gray-700 font-medium">¥{Number(product.buyPrice).toLocaleString()}</p>
      {product.sellPrice !== '' && (
        <p className="text-[10px] text-blue-500">売値 ¥{Number(product.sellPrice).toLocaleString()}</p>
      )}
      {route && (
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${PLATFORM_BADGE[route.platform]} truncate`}>
          {PLATFORM_LABEL[route.platform]} {route.profit >= 0 ? '+' : ''}{route.profit.toLocaleString()}円
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────
export default function ProductManager({ calcState, onLoadToCalc, addBtnId, viewMode, onViewModeChange, feeRates, onFeeRatesChange }) {
  const [products, setProducts]               = useState([])
  const [showModal, setShowModal]             = useState(false)
  const [editingProduct, setEditingProduct]   = useState(null)
  const [simulatingProduct, setSimulatingProduct] = useState(null)
  const [search, setSearch]                   = useState('')

  useEffect(() => { setProducts(getAllProducts()) }, [])
  function refresh() { setProducts(getAllProducts()) }

  function openAdd()         { setEditingProduct(createEmptyProduct()); setShowModal(true) }
  function openEdit(product) { setEditingProduct({ ...product }); setShowModal(true) }

  function handleSave(product) {
    const result = saveProduct(product)
    if (result.success) { refresh(); setShowModal(false) }
    return result
  }

  function handleDelete(id) { deleteProduct(id); refresh() }

  function handleSaveRoute(route) {
    if (!simulatingProduct) return
    saveProduct({ ...simulatingProduct, selectedRoute: route })
    refresh()
    setSimulatingProduct(null)
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // カード共通props
  function cardProps(p) {
    return {
      product:      p,
      onEdit:       () => openEdit(p),
      onDelete:     () => handleDelete(p.id),
      onLoadToCalc: onLoadToCalc,
      onSimulate:   (prod) => setSimulatingProduct(prod),
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">

      {/* 検索バー */}
      {products.length > 0 && (
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="商品名で検索..."
            className="w-full border border-gray-300 rounded-xl bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {/* 商品追加ボタン（フローティング的に目立つ帯） */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">{products.length} / {MAX_PRODUCTS}件</p>
        <button
          id={addBtnId}
          onClick={openAdd}
          disabled={products.length >= MAX_PRODUCTS}
          className="flex items-center gap-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
        >
          ＋ 商品追加
        </button>
      </div>

      {/* 商品一覧 */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-gray-400">
            {products.length === 0
              ? '商品がまだありません。「商品追加」から登録してください。'
              : '検索に一致する商品がありません。'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-2.5">
          {filtered.map((p) => <CardList key={p.id} {...cardProps(p)} />)}
        </div>
      ) : viewMode === 'grid3thumb' ? (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((p) => <CardGrid3Thumb key={p.id} {...cardProps(p)} />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((p) => <CardGrid3 key={p.id} {...cardProps(p)} />)}
        </div>
      )}

      {/* モーダル類 */}
      {showModal && editingProduct && (
        <ProductFormModal
          product={editingProduct}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          calcState={calcState}
          feeRates={feeRates}
          onFeeRatesChange={onFeeRatesChange}
        />
      )}
      {simulatingProduct && (
        <SimulationModal
          product={simulatingProduct}
          feeRates={feeRates}
          onFeeRatesChange={onFeeRatesChange}
          onClose={() => setSimulatingProduct(null)}
          onSaveRoute={handleSaveRoute}
        />
      )}
    </div>
  )
}