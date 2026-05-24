# デプロイ手順

## 1. Supabaseのセットアップ

[Supabase Dashboard](https://supabase.com/dashboard/project/qhaaciqjspmnqcjalxmf) → SQL Editor で
`supabase/schema.sql` の内容をそのまま実行する。

### Supabaseの追加設定
- **Authentication > Settings** で「Enable Email Signup」をON
- **Authentication > URL Configuration** でサイトURLをVercelのURLに設定

---

## 2. Service Role Keyを取得

[Supabase Dashboard](https://supabase.com/dashboard/project/qhaaciqjspmnqcjalxmf)
→ **Settings > API** で `service_role` キーをコピーしておく。

---

## 3. Vercelへのデプロイ

1. [Vercel](https://vercel.com/) でログイン → 「Add New Project」
2. GitHubリポジトリ `ocr-training3` を選択
3. 以下の環境変数を設定（値は .env.local または各サービスのダッシュボードから取得）:

```
NEXT_PUBLIC_SUPABASE_URL=（Supabase Project URL）
NEXT_PUBLIC_SUPABASE_ANON_KEY=（Supabase Publishable Key）
SUPABASE_SERVICE_ROLE_KEY=（Supabase Service Role Key）

ANTHROPIC_API_KEY=（Claude API Key）

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=（Stripe 公開可能キー）
STRIPE_SECRET_KEY=（Stripe シークレットキー）
STRIPE_WEBHOOK_SECRET=（Stripe 署名シークレット）

STRIPE_PRICE_30_CREDITS=（StripeのPrice ID、下記手順で作成）
STRIPE_PRICE_100_CREDITS=（StripeのPrice ID、下記手順で作成）

NEXT_PUBLIC_APP_URL=（VercelのデプロイURL、例: https://ocr-training3.vercel.app）
```

---

## 4. StripeのPrice IDを作成

Stripe Dashboardで2つの商品を作成する:

| パック名 | 金額 | クレジット |
|---------|------|-----------|
| ライトパック | ¥500 | 30回 |
| スタンダードパック | ¥1,500 | 100回 |

作成後に得られるPrice IDを上記の環境変数に設定する。

---

## 5. StripeのWebhookを設定

Stripe Dashboard → **Webhooks** → 「Add endpoint」:

- Endpoint URL: `https://（VercelのURL）/api/stripe/webhook`
- Events: `checkout.session.completed`

---

## 6. 動作確認

1. VercelのURLにアクセス
2. 新規ユーザー登録（5クレジットが自動付与される）
3. OCRページで画像をアップロードしてテキスト起こし
4. マイページで履歴とクレジット残高を確認
5. クレジット購入（Stripeテスト用カード: 4242 4242 4242 4242）
