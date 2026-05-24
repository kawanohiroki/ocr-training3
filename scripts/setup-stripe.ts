/**
 * Stripeに商品と価格を作成するセットアップスクリプト
 * 実行: npx ts-node scripts/setup-stripe.ts
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

async function main() {
  console.log('Stripe商品と価格を作成中...')

  // 30クレジットパック（500円）
  const product30 = await stripe.products.create({
    name: 'OCRクレジット 30回分',
    description: 'OCR処理を30回利用できるクレジット',
  })

  const price30 = await stripe.prices.create({
    product: product30.id,
    currency: 'jpy',
    unit_amount: 500,
  })

  console.log('30クレジットパック Price ID:', price30.id)

  // 100クレジットパック（1500円）
  const product100 = await stripe.products.create({
    name: 'OCRクレジット 100回分',
    description: 'OCR処理を100回利用できるクレジット',
  })

  const price100 = await stripe.prices.create({
    product: product100.id,
    currency: 'jpy',
    unit_amount: 1500,
  })

  console.log('100クレジットパック Price ID:', price100.id)

  console.log('\n.env.localの以下の値を更新してください:')
  console.log(`STRIPE_PRICE_30_CREDITS=${price30.id}`)
  console.log(`STRIPE_PRICE_100_CREDITS=${price100.id}`)
}

main().catch(console.error)
