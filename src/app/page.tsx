import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            書物のテキストを
            <br />
            <span className="text-indigo-600">AIで自動起こし</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            書物のページを撮影した画像をアップロードするだけで、
            Claude AIが高精度でテキストを書き起こします。
            HEIC・JPEG・PNG・WebP形式に対応。
          </p>

          <div className="flex gap-4 justify-center mb-12">
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              無料で始める（5回分）
            </Link>
            <Link
              href="/login"
              className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              ログイン
            </Link>
          </div>

          {/* 機能説明 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-2xl mb-2">📷</div>
              <h3 className="font-semibold text-gray-900 mb-1">HEIC対応</h3>
              <p className="text-sm text-gray-600">
                iPhoneで撮影したHEIC形式の画像もそのままアップロード可能
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold text-gray-900 mb-1">AI高精度OCR</h3>
              <p className="text-sm text-gray-600">
                Claude AIが日本語・英語を問わず高精度でテキストを書き起こし
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-semibold text-gray-900 mb-1">履歴管理</h3>
              <p className="text-sm text-gray-600">
                過去に処理したテキストをマイページで管理・ダウンロード可能
              </p>
            </div>
          </div>

          {/* 料金プラン */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">料金プラン</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="font-semibold text-green-700 mb-1">新規登録特典</div>
                <div className="text-2xl font-bold text-gray-900">無料</div>
                <div className="text-sm text-gray-600 mt-1">5回分のクレジット</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="font-semibold text-gray-700 mb-1">ライトパック</div>
                <div className="text-2xl font-bold text-gray-900">¥500</div>
                <div className="text-sm text-gray-600 mt-1">30回分のクレジット</div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                <div className="font-semibold text-indigo-700 mb-1">スタンダードパック</div>
                <div className="text-2xl font-bold text-gray-900">¥1,500</div>
                <div className="text-sm text-gray-600 mt-1">100回分のクレジット</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
