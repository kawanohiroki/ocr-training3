import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'シグネチャがありません' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook署名検証エラー:', err)
    return NextResponse.json({ error: 'Webhook署名が無効です' }, { status: 400 })
  }

  // 決済完了イベントを処理
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId
    const credits = parseInt(session.metadata?.credits ?? '0', 10)

    if (!userId || !credits) {
      console.error('メタデータが不正:', session.metadata)
      return NextResponse.json({ error: 'メタデータが不正です' }, { status: 400 })
    }

    // Webhook処理にはservice_role keyが必要（RLSをバイパスして任意ユーザーを更新するため）
    // VercelにSUPABASE_SERVICE_ROLE_KEY環境変数を設定すること
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY が未設定です')
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 })
    }

    // 関数内でクライアントを生成（ビルド時エラーを回避）
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // ユーザーのクレジットを加算
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (!profile) {
      console.error('プロフィールが見つかりません:', userId)
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits + credits })
      .eq('id', userId)

    // トランザクション記録を保存
    await supabaseAdmin.from('credit_transactions').insert({
      user_id: userId,
      amount: credits,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_session_id: session.id,
    })

    console.log(`クレジット追加完了: userId=${userId}, credits=${credits}`)
  }

  return NextResponse.json({ received: true })
}
