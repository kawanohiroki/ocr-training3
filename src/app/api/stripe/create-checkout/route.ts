import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// クレジットパック定義
const CREDIT_PACKS = [
  { id: 'pack_30', credits: 30, price: 500 },
  { id: 'pack_100', credits: 100, price: 1500 },
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { packId } = body as { packId: string }

    const pack = CREDIT_PACKS.find(p => p.id === packId)
    if (!pack) {
      return NextResponse.json({ error: '無効なクレジットパックです' }, { status: 400 })
    }

    // ビルド時エラーを避けるため関数内で初期化
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Stripeチェックアウトセッションを作成
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `OCRクレジット ${pack.credits}回分`,
              description: `OCR処理を${pack.credits}回利用できるクレジット`,
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        credits: pack.credits.toString(),
        packId: pack.id,
      },
      success_url: `${appUrl}/mypage?payment=success&credits=${pack.credits}`,
      cancel_url: `${appUrl}/mypage?payment=cancel`,
    })

    return NextResponse.json({ success: true, data: { url: session.url } })
  } catch (error) {
    console.error('Stripeチェックアウト作成エラー:', error)
    return NextResponse.json(
      { error: 'チェックアウトセッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}
