// ユーザープロフィール（Supabase profilesテーブル）
export interface Profile {
  id: string
  email: string
  credits: number
  created_at: string
}

// OCRタスク履歴（Supabase ocr_tasksテーブル）
export interface OcrTask {
  id: string
  user_id: string
  filename: string
  ocr_result: string
  created_at: string
}

// クレジットパック定義
export interface CreditPack {
  id: string
  credits: number
  price: number  // 円
  priceId: string  // Stripe Price ID
  label: string
}

// APIレスポンス共通型
export interface ApiResponse<T = null> {
  success: boolean
  data?: T
  error?: string
}

// OCRリクエストのレスポンス
export interface OcrResponse {
  text: string
  taskId: string
  creditsRemaining: number
}
