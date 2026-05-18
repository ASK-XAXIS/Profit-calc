import { useState } from 'react'
import { feeRate, shippingOptions } from './constants'
import { calcFee, calcProfit, calcBreakEven } from './calc'

function App() {
  const [sellPrice, setSellPrice] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [platform, setPlatform] = useState('mercari')
  const [service, setService] = useState('')
  const [shipping, setShipping] = useState('')
  const[packCost,setPackCost] = useState('0')

//現在のプラットフォームのサービスリスト
const currentServices = shippingOptions[platform]

//選択中のサービスの配送方法リスト
const selectedService = currentServices.find ?
  currentServices.find((s) => s.service === service) : null
const currentOptions = selectedService ? selectedService.options : []

  //選択中の送料を取得
  const selectedOption = currentOptions.find((o) => o.value === shipping)
  const ship = selectedOption ? selectedOption.fee : 0

  const fee = calcFee(Number(sellPrice) || 0, feeRate[platform])
  const profit = calcProfit(Number(sellPrice) || 0, Number(buyPrice) || 0, fee, Number(ship) || 0, Number(packCost) || 0)
  const breakEven = calcBreakEven(Number(buyPrice) || 0, Number(ship) || 0, Number(packCost) || 0, feeRate[platform])

  //プラットフォーム変更時に配送方法をリセット
  const handlePlatformChange = (e) => {
    setPlatform(e.target.value)
    setService('')
    setShipping('')
  }

  const profitColor = profit > 0 ? 'text-blue-600' : profit < 0 ? 'text-red-500' : 'text-gray-400'

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          利益計算アプリ
        </h1>

        {/* プラットフォーム選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            プラットフォーム
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={platform}
            onChange={handlePlatformChange}
          >
            <option value="mercari">メルカリ（10%）</option>
            <option value="yahoo">Yahoo!フリマ（5%）</option>
            <option value="rakuma">ラクマ（10%）</option>
          </select>
        </div>

        {/* 配送サービス選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            配送サービス
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={service}
            onChange={(e) => {
              setService(e.target.value)
              setShipping('')
            }}
          >
            <option value="">選択してください</option>
            {currentServices.map((s) => (
              <option key={s.service} value={s.service}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

         {/* 配送方法選択 */}
        {service && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              配送方法
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
            >
              <option value="">選択してください</option>
              {currentOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}（{o.fee}円）
                </option>
              ))}
            </select>
          </div>
        )}

          {/* 梱包材費入力 */}
          <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            梱包材費（円）
          </label>
           <input
              type = "text"
              inputMode = "numeric"
              pattern = "[0-9]*"
              className = "w-full border border-gray-300 rounded-1g px-3 py-2 text-gray-800 focus:outline-none focus:ring-blue-400"
              value={packCost}
              onChange={(e)=> {
                const val = e.target.value
                if(val ===''||/^[0-9]+$/.test(val)){
                  setPackCost(val === '' ? '' : Number(val))
                }
              }}
              placeholder="例 : 50"
            />
        </div>

        {/* 売値 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            売値（円）
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={sellPrice}
            onChange={(e) => {
              const val = e.target.value
              if (val === '' || /^[0-9]+$/.test(val)) {
                setSellPrice(val === '' ? '' : Number(val))
              }
    }}
            placeholder="例：3000"
          />
        </div>

        {/* 仕入れ値 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            仕入れ値（円）
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={buyPrice}
            onChange={(e) => {
              const val = e.target.value
              if (val === '' || /^[0-9]+$/.test(val)) {
                setBuyPrice(val === '' ? '' : Number(val))
              }
            }}
            placeholder="例：1000"
          />
        </div>

        {/* 結果 */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>手数料</span>
            <span>{Math.round(fee)} 円</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>送料</span>
            <span>{ship} 円</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
            <span className="text-gray-800">利益</span>
            <span className={profitColor}>{Math.round(profit)} 円</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>損益分岐点</span>
            <span>{sellPrice ? breakEven : '---'} 円</span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App