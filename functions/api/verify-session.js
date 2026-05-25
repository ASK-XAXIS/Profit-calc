// functions/api/verify-session.js
// Cloudflare Pages Functions — Stripe 決済セッション確認

export async function onRequestPost(context) {
  const { env, request } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId が必要です' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        },
      }
    )

    const session = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({ error: '確認エラー' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // payment_status が 'paid' なら購入成功
    const success = session.payment_status === 'paid'

    return new Response(JSON.stringify({ success, paymentStatus: session.payment_status }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Verify error:', err)
    return new Response(JSON.stringify({ error: 'サーバーエラー' }), {
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