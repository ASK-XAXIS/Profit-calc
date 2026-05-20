// feeConfig.js
// 手数料設定の共通定義・ユーティリティ

export const RAKUMA_FEE_OPTIONS = [
  { label: '10%（通常）', value: 0.10  },
  { label: '9%',          value: 0.09  },
  { label: '8%',          value: 0.08  },
  { label: '7%',          value: 0.07  },
  { label: '6%',          value: 0.06  },
  { label: '4.5%',        value: 0.045 },
]

export const RAKUMA_FEE_KEY = 'rakuma_fee_rate'

/** ラクマ手数料を localStorage から読み込む（デフォルト 10%） */
export function loadRakumaFee() {
  const saved = localStorage.getItem(RAKUMA_FEE_KEY)
  return saved ? Number(saved) : 0.10
}

/** ラクマ手数料を localStorage に保存する */
export function saveRakumaFee(val) {
  localStorage.setItem(RAKUMA_FEE_KEY, String(val))
}

/** 手数料率を % 文字列に変換（例: 0.045 → "4.5%" ） */
export function feeLabel(rate) {
  return (rate * 100).toFixed(1).replace('.0', '') + '%'
}
