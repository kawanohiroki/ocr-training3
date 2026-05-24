'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavbarProps {
  userEmail?: string
  credits?: number
}

export default function Navbar({ userEmail, credits }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          OCR テキスト起こし
        </Link>

        <div className="flex items-center gap-4">
          {userEmail ? (
            <>
              {/* クレジット残高表示 */}
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                残クレジット: <strong className="text-indigo-600">{credits ?? 0}</strong> 回
              </span>

              <Link
                href="/ocr"
                className="text-sm text-gray-700 hover:text-indigo-600 transition-colors"
              >
                OCR処理
              </Link>

              <Link
                href="/mypage"
                className="text-sm text-gray-700 hover:text-indigo-600 transition-colors"
              >
                マイページ
              </Link>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-700 hover:text-indigo-600 transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                新規登録
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
