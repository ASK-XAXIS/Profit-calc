const STORAGE_KEY = 'flea_market_products'
const MAX_PRODUCTS = 100

export function getAllProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveProduct(product) {
  const products = getAllProducts()
  const idx = products.findIndex((p) => p.id === product.id)

  if (idx >= 0) {
    products[idx] = { ...product, updatedAt: new Date().toISOString() }
  } else {
    if (products.length >= MAX_PRODUCTS) {
      return { success: false, message: `商品は最大${MAX_PRODUCTS}件まで保存できます。` }
    }
    products.push({
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  return { success: true }
}

export function deleteProduct(id) {
  const products = getAllProducts().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

export function createEmptyProduct() {
  return {
    id: crypto.randomUUID(),
    name: '',
    stock: '',
    buyPrice: '',
    sellPrice: '',
    description: '',   // 商品説明文
    registeredDate: '',
    soldDate: '',
    thickness: '',
    platform: '',
    service: '',
    shipping: '',
    packCost: '',
    createdAt: null,
    updatedAt: null,
  }
}

export function getAvailableShippingByThickness(thicknessCm) {
  const t = parseFloat(thicknessCm)
  if (isNaN(t) || t <= 0) return []
  const methods = []
  if (t <= 2.5) methods.push('ゆうパケットポストmini（〜2.5cm）')
  if (t <= 3.0) methods.push('ネコポス（〜3cm）')
  if (t <= 3.0) methods.push('ゆうパケット（〜3cm）')
  if (t <= 3.0) methods.push('ゆうパケットポスト（〜3cm）')
  if (t <= 3.0) methods.push('クリックポスト（〜3cm）')
  if (t <= 5.0) methods.push('宅急便コンパクト（〜5cm）')
  if (t <= 7.0) methods.push('ゆうパケットプラス（〜7cm）')
  methods.push('宅急便・ゆうパック（サイズ便）')
  return methods
}