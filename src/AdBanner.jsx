// AdBanner.jsx
// Google AdSense バナー広告コンポーネント
// プレミアムユーザーには非表示

import { useEffect, useRef } from 'react'
import { isPremium } from './planStore'

// ─────────────────────────────────────────
// AdBanner コンポーネント
// ─────────────────────────────────────────
// props:
//   slot    : AdSenseの広告ユニットID（例: "1234567890"）
//   format  : 'auto' | 'rectangle' | 'horizontal' (default: 'auto')
//   className: 追加のCSSクラス

export default function AdBanner({ slot, format = 'auto', className = '' }) {
  const adRef  = useRef(null)
  const pushed = useRef(false)

  useEffect(() => {
    // プレミアムユーザーには広告を表示しない
    if (isPremium()) return
    // 二重pushを防ぐ
    if (pushed.current) return
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({})
        pushed.current = true
      }
    } catch (e) {
      console.warn('AdSense error:', e)
    }
  }, [])

  // プレミアムユーザーには何も表示しない
  if (isPremium()) return null

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9473385884823712"
        data-ad-slot={slot || '6515851195'}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
