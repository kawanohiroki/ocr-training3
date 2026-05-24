-- ============================================
-- OCRアプリ v3 Supabaseスキーマ
-- ============================================

-- ユーザープロフィールテーブル
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 5,  -- 新規ユーザーへの初期クレジット
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OCRタスク履歴テーブル
CREATE TABLE IF NOT EXISTS public.ocr_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  ocr_result TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- クレジット購入トランザクションテーブル
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のレコードのみ読み書き可能
CREATE POLICY "ユーザーは自分のプロフィールを参照できる"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "ユーザーは自分のプロフィールを更新できる"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ocr_tasks: 自分のタスクのみ操作可能
CREATE POLICY "ユーザーは自分のタスクを参照できる"
  ON public.ocr_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のタスクを作成できる"
  ON public.ocr_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のタスクを削除できる"
  ON public.ocr_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- credit_transactions: 自分のトランザクションのみ参照可能
CREATE POLICY "ユーザーは自分のトランザクションを参照できる"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 新規ユーザー登録時にprofilesを自動作成するTrigger
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
