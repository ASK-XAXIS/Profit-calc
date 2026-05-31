import { useState, useEffect, useRef } from 'react'
import {
  getAllProducts,
  saveProduct,
  deleteProduct,
  createEmptyProduct,
} from './productStore'
import { shippingOptions } from './constants'
import SimulationModal from './SimulationModal'
import SoldModal from './SoldModal'
import { saveSale, getSoldCountByProductId } from './salesStore'
import { RAKUMA_FEE_OPTIONS, feeLabel } from './feeConfig.jsx'
import { getAllHistory, pushHistory, deleteHistory } from './productHistoryStore'
import { isPremium, getProductLimit, FREE_LIMIT } from './planStore'

const MAX_IMAGES    = 10

const PLATFORM_LABEL = {
  mercari: 'メルカリ',
  yahoo:   'Yahoo!フリマ',
  rakuma:  'ラクマ',
  yahuoku: 'ヤフオク',
}
const PLATFORM_BADGE = {
  mercari: 'bg-red-100 text-red-700 border-red-200',
  yahoo:   'bg-purple-100 text-purple-700 border-purple-200',
  rakuma:  'bg-blue-100 text-blue-800 border-blue-200',
  yahuoku: 'bg-orange-100 text-orange-700 border-orange-200',
}

// ─────────────────────────────────────────
// 表示モードトグル
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
          <rect x="2"   y="2"  width="5" height="5" rx="1" />
          <rect x="7.5" y="2"  width="5" height="5" rx="1" />
          <rect x="13"  y="2"  width="5" height="5" rx="1" />
          <rect x="2"   y="8"  width="5" height="5" rx="1" />
          <rect x="7.5" y="8"  width="5" height="5" rx="1" />
          <rect x="13"  y="8"  width="5" height="5" rx="1" />
          <rect x="2"   y="14" width="5" height="5" rx="1" />
          <rect x="7.5" y="14" width="5" height="5" rx="1" />
          <rect x="13"  y="14" width="5" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'grid3',
      label: 'コンパクト',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <rect x="2"   y="3"  width="5" height="4" rx="1" />
          <rect x="7.5" y="3"  width="5" height="4" rx="1" />
          <rect x="13"  y="3"  width="5" height="4" rx="1" />
          <rect x="2"   y="8"  width="5" height="4" rx="1" />
          <rect x="7.5" y="8"  width="5" height="4" rx="1" />
          <rect x="13"  y="8"  width="5" height="4" rx="1" />
          <rect x="2"   y="13" width="5" height="4" rx="1" />
          <rect x="7.5" y="13" width="5" height="4" rx="1" />
          <rect x="13"  y="13" width="5" height="4" rx="1" />
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
            viewMode === m.id ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400 hover:text-gray-600',
          ].join(' ')}
        >
          {m.icon}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────
// 画像アップロード
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
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const MAX = 800
          let { width, height } = img
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX }
            else { width = Math.round(width * MAX / height); height = MAX }
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

  function removeImage(idx) { onChange(images.filter((_, i) => i !== idx)) }
  function moveLeft(idx) {
    if (idx === 0) return
    const arr = [...images]; [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]; onChange(arr)
  }
  function moveRight(idx) {
    if (idx === images.length - 1) return
    const arr = [...images]; [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]]; onChange(arr)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">
          商品画像 <span className="text-gray-400 font-normal">({images.length}/{MAX_IMAGES}枚)</span>
        </span>
        {images.length < MAX_IMAGES && (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="text-xs text-blue-500 font-semibold hover:text-blue-600">＋ 追加</button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => handleFiles(e.target.files)} />

      {images.length === 0 && (
        <div onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M12 3.75v8.25m0 0l-3-3m3 3l3-3" />
          </svg>
          <p className="text-xs text-gray-400">タップして画像を選択</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((src, idx) => (
            <div key={idx} className="relative group aspect-square">
              <img src={src} alt="" className={`w-full h-full object-cover rounded-lg ${idx === 0 ? 'ring-2 ring-blue-400' : ''}`} />
              {idx === 0 && <span className="absolute top-0.5 left-0.5 rounded text-[9px] font-bold bg-blue-500 text-white px-1 py-0.5">表紙</span>}
              <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                <button type="button" onClick={() => removeImage(idx)}
                  className="rounded-full bg-red-500 text-white w-6 h-6 flex items-center justify-center text-xs font-bold">×</button>
                <div className="flex gap-1">
                  {idx > 0 && <button type="button" onClick={() => moveLeft(idx)} className="rounded bg-white/80 text-gray-700 px-1 text-xs">←</button>}
                  {idx < images.length - 1 && <button type="button" onClick={() => moveRight(idx)} className="rounded bg-white/80 text-gray-700 px-1 text-xs">→</button>}
                </div>
              </div>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <div onClick={() => fileRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition">
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
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}

function ProductFormModal({ product: initial, onSave, onSaveDraft, onClose, calcState, feeRates, onFeeRatesChange }) {
  const [p, setP] = useState(initial)
  const [errors, setErrors] = useState({})
  const [showHistory, setShowHistory] = useState(false)
  const [history] = useState(() => getAllHistory())

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
  function handlePlatformChange(val) { setP((prev) => ({ ...prev, platform: val, service: '', shipping: '' })) }
  function handleServiceChange(val)  { setP((prev) => ({ ...prev, service: val, shipping: '' })) }

  function validate() {
    const e = {}
    if (!p.name.trim()) e.name = '商品名を入力してください'
    if (p.stock === '' || Number(p.stock) < 0) e.stock = '在庫数を0以上で入力してください'
    if (p.buyPrice === '' || isNaN(Number(p.buyPrice))) e.buyPrice = '仕入れ値を入力してください'
    if ((p.description || '').length > 1000) e.description = '商品説明文は1000文字以内で入力してください'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    const result = onSave({
      ...p,
      stock:       Number(p.stock),
      buyPrice:    Number(p.buyPrice),
      sellPrice:   p.sellPrice   !== '' ? Number(p.sellPrice)   : '',
      thickness:   p.thickness   !== '' ? Number(p.thickness)   : '',
      packCost:    p.packCost    !== '' ? Number(p.packCost)    : '',
      description: p.description || '',
      images:      p.images      || [],
      isDraft:     false,
    })
    if (result && !result.success) setErrors({ global: result.message })
  }

  // 一時保存（バリデーションなし）
  function handleSaveDraft() {
    onSaveDraft({
      ...p,
      stock:       p.stock      !== '' ? Number(p.stock)      : '',
      buyPrice:    p.buyPrice   !== '' ? Number(p.buyPrice)   : '',
      sellPrice:   p.sellPrice  !== '' ? Number(p.sellPrice)  : '',
      thickness:   p.thickness  !== '' ? Number(p.thickness)  : '',
      packCost:    p.packCost   !== '' ? Number(p.packCost)   : '',
      description: p.description || '',
      images:      p.images      || [],
      isDraft:     true,
    })
  }

  // 履歴から適用
  function applyHistory(entry) {
    setP((prev) => ({
      ...prev,
      name:        entry.name        || prev.name,
      buyPrice:    entry.buyPrice    !== '' ? String(entry.buyPrice)   : prev.buyPrice,
      sellPrice:   entry.sellPrice   !== '' ? String(entry.sellPrice)  : prev.sellPrice,
      description: entry.description || prev.description,
      thickness:   entry.thickness   !== '' ? String(entry.thickness)  : prev.thickness,
      platform:    entry.platform    || prev.platform,
      service:     entry.service     || prev.service,
      shipping:    entry.shipping    || prev.shipping,
      packCost:    entry.packCost    !== '' ? String(entry.packCost)   : prev.packCost,
      images:      entry.images?.length ? entry.images : prev.images,
    }))
    setShowHistory(false)
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
     calcState.platform || calcState.service || calcState.packCost !== '')

  const ic = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{isEdit ? '商品を編集' : '商品を追加'}</h2>
          <div className="flex items-center gap-2">
            {/* 履歴ボタン（新規追加時のみ） */}
            {!isEdit && history.length > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className="rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-xs font-semibold text-white transition"
              >
                📋 履歴
              </button>
            )}
            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>

        {/* 一時保存中バナー */}
        {initial.isDraft && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2">
            <span className="text-amber-500 text-sm">📝</span>
            <p className="text-xs font-semibold text-amber-700">一時保存中のデータを編集しています</p>
          </div>
        )}

        {!isEdit && hasCalcData && (
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-blue-700">計算機に入力済みの情報があります</p>
            <button onClick={applyCalcState} className="shrink-0 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition">一括適用</button>
          </div>
        )}

        <div className="px-6 py-5 max-h-[68vh] overflow-y-auto space-y-4">
          {errors.global && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errors.global}</p>}

        {/* 履歴選択モーダル（インライン） */}
        {showHistory && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gray-700 px-5 py-4 flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">登録履歴から選択</h3>
                <button onClick={() => setShowHistory(false)} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
              </div>
              <div className="overflow-y-auto divide-y divide-gray-50" style={{ maxHeight: '55vh' }}>
                {history.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">履歴がありません</p>
                ) : history.map((entry) => (
                  <button key={entry.id} onClick={() => applyHistory(entry)}
                    className="w-full flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition text-left">
                    {entry.images?.[0]
                      ? <img src={entry.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 mt-0.5" />
                      : <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{entry.name}</p>
                      <p className="text-xs text-gray-400">
                        仕入れ ¥{Number(entry.buyPrice).toLocaleString()}
                        {entry.sellPrice !== '' && ` / 売値 ¥${Number(entry.sellPrice).toLocaleString()}`}
                      </p>
                      <p className="text-[10px] text-gray-300">{entry.savedAt?.slice(0, 10)}</p>
                    </div>
                    <span className="text-xs text-blue-500 font-semibold shrink-0 mt-1">適用</span>
                  </button>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <button onClick={() => setShowHistory(false)}
                  className="w-full rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

          <ImageUploader images={p.images || []} onChange={(imgs) => set('images', imgs)} />
          <div className="border-t border-gray-100" />

          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest">必須情報</p>

          <div>
            <FieldLabel label="商品名" required />
            <input
              type="text"
              value={p.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="例：ヴィンテージTシャツ"
              maxLength={65}
              className={ic}
            />
            <div className="flex items-start justify-between mt-1 gap-2">
              <div className="flex-1">
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                {/* メルカリ・ラクマの40文字超え警告（邪魔しない形で表示） */}
                {p.name.length > 40 && (p.platform === 'mercari' || p.platform === 'rakuma') && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <span>⚠</span>
                    {p.platform === 'mercari' ? 'メルカリ' : 'ラクマ'}は40文字まで（現在{p.name.length}文字）
                  </p>
                )}
                {p.name.length > 40 && !p.platform && (
                  <p className="text-xs text-amber-500">メルカリ・ラクマは40文字まで</p>
                )}
              </div>
              {/* 文字数カウント */}
              <span className={`text-xs shrink-0 ${p.name.length >= 60 ? 'text-red-400 font-semibold' : p.name.length > 40 ? 'text-amber-500' : 'text-gray-300'}`}>
                {p.name.length}/65
              </span>
            </div>
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
          </div>

          <div>
            <FieldLabel label="プラットフォーム" />
            <select value={p.platform} onChange={(e) => handlePlatformChange(e.target.value)} className={ic}>
              <option value="">選択してください</option>
              <option value="mercari">メルカリ（10%）</option>
              <option value="yahoo">Yahoo!フリマ（5%）</option>
              <option value="rakuma">ラクマ（{feeLabel(feeRates?.rakuma ?? 0.10)}）</option>
              <option value="yahuoku">ヤフオク（10%）</option>
            </select>
          </div>

          {p.platform === 'rakuma' && (
            <div>
              <FieldLabel label="ラクマ手数料率" />
              <select value={feeRates?.rakuma ?? 0.10}
                onChange={(e) => onFeeRatesChange?.({ ...feeRates, rakuma: Number(e.target.value) })}
                className={ic}>
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
            <FieldLabel label="商品の厚み（cm）" />
            <input type="text" inputMode="decimal" value={p.thickness} onChange={numericChange('thickness')} placeholder="例：2.5" className={ic} />
            <p className="text-xs text-gray-400 mt-1">シミュレーションの発送方法絞り込みに使用されます</p>
          </div>

          <div>
            <FieldLabel label="商品説明文" />
            <textarea
              value={p.description || ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="商品の状態、サイズ、特徴などを入力..."
              rows={4}
              className={`w-full border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 resize-none text-sm ${
                (p.description || '').length > 1000
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-blue-400'
              }`}
            />
            <div className="flex items-start justify-between mt-1 gap-2">
              <div className="flex-1">
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description}</p>
                )}
              </div>
              {/* リアルタイム文字数カウント */}
              <span className={`text-xs shrink-0 tabular-nums ${
                (p.description || '').length > 1000
                  ? 'text-red-500 font-bold'
                  : (p.description || '').length > 900
                  ? 'text-amber-500 font-semibold'
                  : 'text-gray-300'
              }`}>
                {(p.description || '').length}/1000
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition"
          >
            一時保存
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="rounded-lg px-5 py-2 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition">キャンセル</button>
          <button onClick={handleSave} className="rounded-lg px-5 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">保存する</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// サムネイル
// ─────────────────────────────────────────
function Thumbnail({ src, size = 'md' }) {
  const sizeClass = { sm: 'w-full aspect-square', md: 'w-16 h-16 shrink-0' }[size]
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

// 在庫バッジ
function StockBadge({ stock }) {
  if (Number(stock) <= 0) {
    return <span className="rounded-full bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5">在庫なし</span>
  }
  return <span className="text-xs text-gray-400">在庫 <span className="font-semibold text-gray-600">{stock}</span></span>
}

// ─────────────────────────────────────────
// 説明文の折りたたみ表示
// ─────────────────────────────────────────
const DESCRIPTION_LIMIT = 300

function DescriptionBlock({ text }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > DESCRIPTION_LIMIT

  const displayed = isLong && !expanded
    ? text.slice(0, DESCRIPTION_LIMIT)
    : text

  return (
    <div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {displayed}
        {isLong && !expanded && (
          <span className="text-gray-400">…</span>
        )}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-semibold text-blue-500 hover:text-blue-700 transition flex items-center gap-1"
        >
          {expanded ? (
            <>
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 10l4-4 4 4" />
              </svg>
              閉じる
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6l4 4 4-4" />
              </svg>
              もっと読む（残り{text.length - DESCRIPTION_LIMIT}文字）
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// コピーボタン
// ─────────────────────────────────────────
function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
        copied
          ? 'bg-emerald-100 text-emerald-600'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      } ${className}`}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 8l3.5 3.5L13 4" />
          </svg>
          コピー済
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="5" y="5" width="8" height="8" rx="1" />
            <path d="M3 11V3h8" />
          </svg>
          コピー
        </>
      )}
    </button>
  )
}

// ─────────────────────────────────────────
// 商品詳細ページ（全面表示）
// ─────────────────────────────────────────
function ProductDetailPage({ product, onEdit, onBack, onSold, onSimulate }) {
  const [imageIdx, setImageIdx]     = useState(0)
  const images   = product.images || []
  const soldCount = getSoldCountByProductId(product.id)
  const route    = product.selectedRoute || null
  const isOutOfStock = Number(product.stock) <= 0

  const PLATFORM_LABEL_LOCAL = {
    mercari: 'メルカリ', yahoo: 'Yahoo!フリマ', rakuma: 'ラクマ', yahuoku: 'ヤフオク',
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col bg-gray-100 min-h-screen">

      {/* トップバー */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm flex items-center gap-3 px-4 h-14">
        <button onClick={onBack}
          className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition text-sm font-semibold">
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 4l-6 6 6 6" />
          </svg>
          戻る
        </button>
        <h2 className="flex-1 text-sm font-bold text-gray-800 truncate">{product.name}</h2>
        <button onClick={onEdit}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
          編集
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">

        {/* 画像エリア */}
        {images.length > 0 ? (
          <div>
            <div className="aspect-square bg-gray-200 overflow-hidden">
              <img src={images[imageIdx]} alt="商品" className="w-full h-full object-contain bg-white" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 px-4 py-2 bg-white overflow-x-auto">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setImageIdx(i)}
                    className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                      i === imageIdx ? 'border-blue-400' : 'border-transparent'
                    }`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square bg-gray-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-16 h-16 text-gray-200">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18" />
            </svg>
          </div>
        )}

        <div className="px-4 py-4 flex flex-col gap-4">

          {/* 商品名 */}
          <div className="bg-white rounded-2xl px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 mb-1">商品名</p>
                <p className="text-lg font-bold text-gray-800 leading-snug">{product.name}</p>
              </div>
              <CopyButton text={product.name} />
            </div>

            {/* 在庫 + 累計売上数 */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">在庫数</p>
                {isOutOfStock
                  ? <span className="rounded-full bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5">在庫なし</span>
                  : <p className="text-sm font-bold text-gray-800">{product.stock}個</p>
                }
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">累計売上数</p>
                <p className="text-sm font-bold text-emerald-600">{soldCount}件</p>
              </div>
            </div>
          </div>

          {/* 価格情報 */}
          <div className="bg-white rounded-2xl px-4 py-4">
            <p className="text-[10px] text-gray-400 mb-3">価格情報</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">仕入れ価格</p>
                <p className="text-base font-black text-gray-800">
                  ¥{product.buyPrice !== '' ? Number(product.buyPrice).toLocaleString() : '---'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">販売想定価格</p>
                <p className="text-base font-black text-blue-600">
                  {product.sellPrice !== '' ? `¥${Number(product.sellPrice).toLocaleString()}` : '未設定'}
                </p>
              </div>
              {product.packCost !== '' && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">梱包材費</p>
                  <p className="text-sm font-semibold text-gray-600">¥{Number(product.packCost).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* 現在の販売ルート */}
          {route && (
            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[10px] text-gray-400 mb-2">現在の販売ルート</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5">
                  {PLATFORM_LABEL_LOCAL[route.platform] || route.platform}
                </span>
                <span className="rounded-full bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5">{route.serviceLabel}</span>
                <span className="rounded-full bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5">{route.shippingLabel}</span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>送料 ¥{route.shippingFee}</span>
                <span className={`font-bold ${route.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  利益 {route.profit >= 0 ? '+' : ''}¥{route.profit.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* 商品説明文 */}
          {product.description ? (
            <div className="bg-white rounded-2xl px-4 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-400">商品説明文</p>
                <CopyButton text={product.description} />
              </div>
              <DescriptionBlock text={product.description} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-gray-300">商品説明文は未登録です</p>
              <button onClick={onEdit}
                className="text-xs text-blue-400 hover:text-blue-600 underline">追加する</button>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2">
            <button
              onClick={() => onSold(product)}
              disabled={isOutOfStock}
              className="flex-1 rounded-xl border border-emerald-300 bg-emerald-50 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
            >
              🎉 売れた！
            </button>
            <button
              onClick={() => onSimulate(product)}
              className="flex-1 rounded-xl border border-amber-200 bg-amber-50 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition flex items-center justify-center gap-1.5"
            >
              📊 シミュレーション
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 商品カード — リスト表示
// ─────────────────────────────────────────
function CardList({ product, onEdit, onDelete, onLoadToCalc, onSimulate, onSold, onDetail }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const route      = product.selectedRoute || null
  const routeBadge = route ? (PLATFORM_BADGE[route.platform] || '') : ''
  const thumb      = product.images?.[0] || null
  const isOutOfStock = Number(product.stock) <= 0

  return (
    <div className={`rounded-xl border bg-white shadow-sm p-3 flex gap-3 ${isOutOfStock ? 'border-red-100 opacity-75' : product.isDraft ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
      {/* サムネをタップで詳細へ */}
      <button onClick={() => onDetail(product)} className="shrink-0">
        <Thumbnail src={thumb} size="md" />
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-1">
          <button onClick={() => onDetail(product)} className="min-w-0 text-left flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-gray-800 text-sm truncate">{product.name || '（名称未設定）'}</p>
              {product.isDraft && (
                <span className="rounded-full bg-amber-200 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 shrink-0">📝 下書き</span>
              )}
            </div>
            <StockBadge stock={product.stock} />
          </button>
          <div className="flex gap-1 shrink-0 flex-wrap justify-end">
            <button onClick={() => onLoadToCalc(product)} className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-100 transition">計算機</button>
            <button onClick={onEdit} className="rounded border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 transition">編集</button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="rounded border border-gray-200 px-2 py-0.5 text-[10px] text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">削除</button>
            ) : (
              <>
                <button onClick={onDelete} className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">確認</button>
                <button onClick={() => setConfirmDelete(false)} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">戻る</button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <span className="text-gray-400">仕入れ <span className="text-gray-700 font-semibold">¥{Number(product.buyPrice).toLocaleString()}</span></span>
          {product.sellPrice !== '' && <span className="text-gray-400">売値 <span className="text-blue-600 font-semibold">¥{Number(product.sellPrice).toLocaleString()}</span></span>}
        </div>

        {route && (
          <div className={`rounded px-2 py-1 text-[10px] border ${routeBadge} flex gap-1.5 flex-wrap items-center`}>
            <span className="font-bold">{PLATFORM_LABEL[route.platform] || route.platform}</span>
            <span className="text-gray-500">{route.shippingLabel}</span>
            <span className={`font-bold ml-auto ${route.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {route.profit >= 0 ? '+' : ''}{route.profit.toLocaleString()}円
            </span>
          </div>
        )}

        <div className="flex gap-1.5">
          {/* 売れた！ボタン */}
          <button
            onClick={() => onSold(product)}
            disabled={isOutOfStock || !!product.isDraft}
            className="flex-1 rounded border border-emerald-300 bg-emerald-50 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1"
          >
            🎉 売れた！
          </button>
          <button onClick={() => onSimulate(product)} className="flex-1 rounded border border-amber-200 bg-amber-50 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 transition flex items-center justify-center gap-1">
            📊 シミュレーション
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 商品カード — グリッド3列・サムネ付き
// ─────────────────────────────────────────
function CardGrid3Thumb({ product, onEdit, onDelete, onLoadToCalc, onSimulate, onSold, onDetail }) {
  const [showMenu, setShowMenu] = useState(false)
  const route = product.selectedRoute || null
  const thumb = product.images?.[0] || null
  const isOutOfStock = Number(product.stock) <= 0
  const isDraft = !!product.isDraft

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col ${isOutOfStock ? 'border-red-100 opacity-75' : isDraft ? 'border-amber-300' : 'border-gray-200'}`}>
      <div className="relative aspect-square bg-gray-50 cursor-pointer" onClick={() => onDetail(product)}>
        <Thumbnail src={thumb} size="sm" />
        {isDraft && (
          <div className="absolute top-1 left-1">
            <span className="rounded-full bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5">📝 下書き</span>
          </div>
        )}
        {isOutOfStock && !isDraft && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center rounded-t-xl">
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">在庫なし</span>
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v) }}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/30 text-white flex items-center justify-center text-xs hover:bg-black/50 transition">⋯</button>
        {showMenu && (
          <div className="absolute top-7 right-1 z-10 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden min-w-[80px]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { onDetail(product); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">詳細</button>
            <button onClick={() => { onLoadToCalc(product); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">計算機</button>
            <button onClick={() => { onEdit(); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">編集</button>
            <button onClick={() => { onSold(product); setShowMenu(false) }} disabled={isOutOfStock || isDraft} className="block w-full text-left px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 disabled:opacity-40">売れた！</button>
            <button onClick={() => { onSimulate(product); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50">シミュレーション</button>
            <button onClick={() => { onDelete(); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 border-t border-gray-100">削除</button>
          </div>
        )}
      </div>
      <button onClick={() => onDetail(product)} className="px-2 py-2 flex flex-col gap-1 text-left w-full">
        <p className="font-semibold text-gray-800 text-xs leading-snug line-clamp-2">{product.name || '（名称未設定）'}</p>
        <StockBadge stock={product.stock} />
        <p className="text-[10px] text-gray-500">¥{Number(product.buyPrice).toLocaleString()}</p>
        {route && !isDraft && (
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${PLATFORM_BADGE[route.platform] || 'bg-gray-100 text-gray-600 border-gray-200'} truncate`}>
            {PLATFORM_LABEL[route.platform] || route.platform} {route.profit >= 0 ? '+' : ''}{route.profit.toLocaleString()}円
          </span>
        )}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────
// 商品カード — グリッド3列・サムネなし
// ─────────────────────────────────────────
function CardGrid3({ product, onEdit, onDelete, onLoadToCalc, onSimulate, onSold, onDetail }) {
  const [showMenu, setShowMenu] = useState(false)
  const route = product.selectedRoute || null
  const isOutOfStock = Number(product.stock) <= 0
  const isDraft = !!product.isDraft

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm px-2.5 py-2.5 flex flex-col gap-1.5 relative cursor-pointer ${isOutOfStock ? 'border-red-100 opacity-75' : isDraft ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'}`}
      onClick={() => onDetail(product)}
    >
      <button onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v) }}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs hover:bg-gray-200 transition">⋯</button>
      {showMenu && (
        <div className="absolute top-6 right-1 z-10 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden min-w-[80px]" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { onDetail(product); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">詳細</button>
          <button onClick={() => { onLoadToCalc(product); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">計算機</button>
          <button onClick={() => { onEdit(); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">編集</button>
          <button onClick={() => { onSold(product); setShowMenu(false) }} disabled={isOutOfStock || isDraft} className="block w-full text-left px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 disabled:opacity-40">売れた！</button>
          <button onClick={() => { onSimulate(product); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50">シミュレーション</button>
          <button onClick={() => { onDelete(); setShowMenu(false) }} className="block w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 border-t border-gray-100">削除</button>
        </div>
      )}
      <div className="flex items-start gap-1 pr-5">
        <p className="font-semibold text-gray-800 text-xs leading-snug line-clamp-2 flex-1">{product.name || '（名称未設定）'}</p>
        {isDraft && <span className="text-[8px] font-bold text-amber-600 bg-amber-100 rounded px-1 py-0.5 shrink-0 leading-tight">下書き</span>}
      </div>
      <StockBadge stock={product.stock} />
      <p className="text-[10px] text-gray-700 font-medium">¥{Number(product.buyPrice).toLocaleString()}</p>
      {product.sellPrice !== '' && <p className="text-[10px] text-blue-500">売値 ¥{Number(product.sellPrice).toLocaleString()}</p>}
      {route && !isDraft && (
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${PLATFORM_BADGE[route.platform] || 'bg-gray-100 text-gray-600 border-gray-200'} truncate`}>
          {PLATFORM_LABEL[route.platform] || route.platform} {route.profit >= 0 ? '+' : ''}{route.profit.toLocaleString()}円
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────
export default function ProductManager({ calcState, onLoadToCalc, addBtnId, viewMode, onViewModeChange, feeRates, onFeeRatesChange }) {
  const [products, setProducts]                   = useState([])
  const [showModal, setShowModal]                 = useState(false)
  const [editingProduct, setEditingProduct]       = useState(null)
  const [simulatingProduct, setSimulatingProduct] = useState(null)
  const [soldProduct, setSoldProduct]             = useState(null)
  const [detailProduct, setDetailProduct]         = useState(null)
  const [search, setSearch]                       = useState('')
  const [premium, setPremium]                     = useState(isPremium)
  const [showLimitModal, setShowLimitModal]       = useState(false)

  useEffect(() => { setProducts(getAllProducts()) }, [])

  // productStore の変更を即時反映
  useEffect(() => {
    function onUpdate() { setProducts(getAllProducts()) }
    window.addEventListener('products-updated', onUpdate)
    return () => window.removeEventListener('products-updated', onUpdate)
  }, [])

  // プラン変更を即時反映
  useEffect(() => {
    function onPlanUpdate() { setPremium(isPremium()) }
    window.addEventListener('plan-updated', onPlanUpdate)
    return () => window.removeEventListener('plan-updated', onPlanUpdate)
  }, [])

  function refresh() { setProducts(getAllProducts()) }

  function openAdd() {
    const limit = getProductLimit()
    if (products.length >= limit) {
      setShowLimitModal(true)
      return
    }
    setEditingProduct(createEmptyProduct())
    setShowModal(true)
  }
  function openEdit(product) { setEditingProduct({ ...product }); setShowModal(true) }

  function handleSave(product) {
    const result = saveProduct(product)
    if (result.success) {
      // 下書きでない場合のみ履歴に追加
      if (!product.isDraft) pushHistory(product)
      refresh()
      setShowModal(false)
    }
    return result
  }

  function handleSaveDraft(product) {
    saveProduct(product)
    refresh()
    setShowModal(false)
  }

  function handleDelete(id) { deleteProduct(id); refresh() }

  function handleSaveRoute(route) {
    if (!simulatingProduct) return
    saveProduct({ ...simulatingProduct, selectedRoute: route })
    refresh(); setSimulatingProduct(null)
  }

  // 「売れた！」処理：売上を保存し在庫を1減らす
  function handleSoldSave(sale) {
    saveSale(sale)
    if (soldProduct) {
      const newStock = Math.max((Number(soldProduct.stock) || 1) - 1, 0)
      saveProduct({ ...soldProduct, stock: newStock })
      refresh()
    }
    setSoldProduct(null)
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function cardProps(p) {
    return {
      product:      p,
      onEdit:       () => openEdit(p),
      onDelete:     () => handleDelete(p.id),
      onLoadToCalc: onLoadToCalc,
      onSimulate:   (prod) => setSimulatingProduct(prod),
      onSold:       (prod) => setSoldProduct(prod),
      onDetail:     (prod) => setDetailProduct(prod),
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">

      {/* 商品詳細ページ（全面表示） */}
      {detailProduct && (
        <div className="fixed inset-0 z-40 bg-gray-100 overflow-y-auto">
          <ProductDetailPage
            product={detailProduct}
            onBack={() => setDetailProduct(null)}
            onEdit={() => { openEdit(detailProduct); setDetailProduct(null) }}
            onSold={(prod) => { setSoldProduct(prod); setDetailProduct(null) }}
            onSimulate={(prod) => { setSimulatingProduct(prod); setDetailProduct(null) }}
          />
        </div>
      )}

      {products.length > 0 && (
        <div className="mb-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="商品名で検索..."
            className="w-full border border-gray-300 rounded-xl bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">{products.length} / {getProductLimit()}件
          {!premium && <span className="ml-1 text-[10px] text-orange-400">（無料プラン）</span>}
        </p>
        <button id={addBtnId} onClick={openAdd}
          className="flex items-center gap-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 shadow-sm transition">
          ＋ 商品追加
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-gray-400">
            {products.length === 0 ? '商品がまだありません。「商品追加」から登録してください。' : '検索に一致する商品がありません。'}
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

      {showModal && editingProduct && (
        <ProductFormModal
          product={editingProduct}
          onSave={handleSave}
          onSaveDraft={handleSaveDraft}
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

      {soldProduct && (
        <SoldModal
          product={soldProduct}
          feeRates={feeRates}
          onSave={handleSoldSave}
          onClose={() => setSoldProduct(null)}
        />
      )}

      {/* 5件到達バナー（無料プランのみ） */}
      {!premium && products.length >= 5 && products.length < FREE_LIMIT && (
        <div className="fixed bottom-20 left-0 right-0 mx-3 z-30">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-white text-xs font-bold">プレミアムにアップグレード</p>
              <p className="text-blue-100 text-[10px]">商品を100件まで登録 + 経常利益グラフ</p>
            </div>
            <button
              onClick={() => window.__openUpgradeModal?.('banner')}
              className="bg-white text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg shrink-0"
            >
              詳しく見る
            </button>
          </div>
        </div>
      )}

      {/* 15件上限モーダル（無料プラン） */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-6 py-8 text-center">
              <div className="text-4xl mb-2">🚀</div>
              <h2 className="text-white text-lg font-black">商品登録の上限に達しました</h2>
              <p className="text-blue-100 text-xs mt-1">無料プランは{FREE_LIMIT}件まで</p>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="bg-blue-50 rounded-2xl px-4 py-3 space-y-2">
                <p className="text-sm font-bold text-gray-700">プレミアムプランでできること</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✅ 商品登録 最大100件</li>
                  <li>✅ 日・月・年の経常利益グラフ</li>
                  <li>✅ 広告非表示</li>
                </ul>
              </div>
              <button
                onClick={() => { setShowLimitModal(false); window.__openUpgradeModal?.('limit') }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-2xl text-sm shadow"
              >
                プレミアムにアップグレード
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full text-gray-400 text-xs py-2"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}