// UpgradeModal.jsx
// プレミアムアップグレードモーダル（Stripe Checkout連携）

import { useState, useEffect } from 'react'
import { setPlan } from './planStore'

// 決済成功後のURLパラメータを処理（ページ読み込み時に呼ぶ）
export async function handleStripeReturn() {
  const params = new URLSearchParams(window.location.search)
  const sessionId = params.get('session_id')
  const cancelled = params.get('cancelled')

  if (cancelled) {
    // キャンセルされた場合はパラメータだけ消す
    window.history.replaceState({}, '', window.location.pathname)
    return false
  }

  if (!sessionId) return false

  try {
    const res = await fetch('/api/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    const data = await res.json()

    if (data.success) {
      // プレミアムに昇格
      setPlan('premium')
      // セッションIDをlocalStorageに保存（リストア用）
      localStorage.setItem('revofit_session_id', sessionId)
      // URLパラメータを消す
      window.history.replaceState({}, '', window.location.pathname)
      return true
    }
  } catch (err) {
    console.error('Verify failed:', err)
  }

  window.history.replaceState({}, '', window.location.pathname)
  return false
}

// ─────────────────────────────────────────
// アップグレードモーダル本体
// ─────────────────────────────────────────
export default function UpgradeModal({ onClose, trigger = 'manual' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // triggerの種類
  // 'manual'   : 手動で開いた
  // 'limit'    : 15件到達（閉じるボタンあり・追加登録不可）
  // 'calc'     : 計算10回到達
  // 'banner'   : 5件バナーからの誘導
  const isForced = trigger === 'limit'

  async function handlePurchase() {
    setLoading(true)
    setError(null)

    try {
      const currentUrl = window.location.href.split('?')[0]
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          successUrl: `${currentUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl:  `${currentUrl}?cancelled=1`,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || '決済ページの作成に失敗しました')
        setLoading(false)
      }
    } catch (err) {
      setError('通信エラーが発生しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* オーバーレイ（強制モーダルはタップで閉じない） */}
      {!isForced && (
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      )}
      {isForced && (
        <div className="absolute inset-0 bg-black/60" />
      )}

      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ヘッダー */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-5 pt-6 pb-8 text-white text-center relative">
          {!isForced && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <div className="text-3xl mb-2">👑</div>
          <h2 className="text-lg font-black tracking-tight">プレミアムプラン</h2>
          <p className="text-blue-100 text-xs mt-1">買い切り・一度購入すれば永続利用</p>
          <div className="mt-3">
            <span className="text-3xl font-black">¥980</span>
            <span className="text-blue-200 text-xs ml-1">（税込）</span>
          </div>
        </div>

        {/* 機能リスト */}
        <div className="px-5 py-4 space-y-2.5">
          {[
            { icon: '📦', text: '商品登録 最大100件（無料は15件）' },
            { icon: '🛒', text: 'まとめ売り 最大5商品（無料は2商品）' },
            { icon: '📊', text: '経常利益グラフ（日/月/年）' },
            { icon: '📥', text: 'Excel出力機能' },
            { icon: '🚫', text: '広告非表示' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2.5">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>

        {/* 強制モーダル時の説明 */}
        {isForced && (
          <div className="mx-5 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <p className="text-xs text-amber-700 font-semibold">⚠️ 商品登録が上限（15件）に達しました</p>
            <p className="text-[11px] text-amber-600 mt-0.5">追加登録にはプレミアムプランへのアップグレードが必要です</p>
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* ボタン */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full rounded-xl bg-blue-500 py-3 text-sm font-black text-white hover:bg-blue-600 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                決済ページを準備中...
              </span>
            ) : '¥980 でアップグレードする'}
          </button>

          {!isForced && (
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              今はしない
            </button>
          )}

          {isForced && (
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-400 hover:bg-gray-50 transition"
            >
              閉じる（登録上限のまま続ける）
            </button>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-300 pb-4">
          決済はStripeで安全に処理されます
        </p>
      </div>
    </div>
  )
}