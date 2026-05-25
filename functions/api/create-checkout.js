// functions/api/create-checkout.js
// Cloudflare Pages Functions — Stripe Checkout Session 作成

export async function onRequestPost(context) {
  const { env, request } = context

  // CORS ヘッダー
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const body = await request.json()
    const { successUrl, cancelUrl } = body

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price]': env.STRIPE_PRICE_ID,
        'line_items[0][quantity]': '1',
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        'payment_intent_data[metadata][product]': 'revofit_premium',
        locale: 'ja',
      }),
    })

    const session = await response.json()

    if (!response.ok) {
      console.error('Stripe error:', session)
      return new Response(JSON.stringify({ error: session.error?.message || '決済エラー' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Server error:', err)
    return new Response(JSON.stringify({ error: 'サーバーエラーが発生しました' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}