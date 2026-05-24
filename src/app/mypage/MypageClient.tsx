'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import type { OcrTask } from '@/types'

interface MypageClientProps {
  userEmail: string
  credits: number
  tasks: OcrTask[]
}

const CREDIT_PACKS = [
  { id: 'pack_30', label: 'ライトパック', credits: 30, price: 500 },
  { id: 'pack_100', label: 'スタンダードパック', credits: 100, price: 1500 },
]

export default function MypageClient({ userEmail, credits: initialCredits, tasks: initialTasks }: MypageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('payment')

  const [credits, setCredits] = useState(initialCredits)
  const [tasks, setTasks] = useState<OcrTask[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<OcrTask | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const handlePurchase = async (packId: string) => {
    setPurchaseLoading(packId)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error ?? 'チェックアウトの作成に失敗しました')
        return
      }

      // Stripeのチェックアウトページへリダイレクト
      window.location.href = data.data.url
    } catch {
      alert('通信エラーが発生しました')
    } finally {
      setPurchaseLoading(null)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('このタスクを削除しますか？')) return

    setDeleteLoading(taskId)
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' })

      if (!response.ok) {
        alert('削除に失敗しました')
        return
      }

      setTasks(prev => prev.filter(t => t.id !== taskId))
      if (selectedTask?.id === taskId) setSelectedTask(null)
    } catch {
      alert('通信エラーが発生しました')
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleDownload = (task: OcrTask) => {
    const blob = new Blob([task.ocr_result], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ocr_${task.filename}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userEmail={userEmail} credits={credits} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* 決済ステータス通知 */}
        {paymentStatus === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-green-500 text-xl">✅</span>
            <div>
              <p className="font-medium text-green-800">クレジットの購入が完了しました！</p>
              <p className="text-sm text-green-700">クレジットが追加されています。</p>
            </div>
            <button
              onClick={() => router.replace('/mypage')}
              className="ml-auto text-green-600 hover:text-green-800 text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {paymentStatus === 'cancel' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-yellow-500 text-xl">ℹ️</span>
            <p className="text-yellow-800">購入がキャンセルされました。</p>
            <button
              onClick={() => router.replace('/mypage')}
              className="ml-auto text-yellow-600 hover:text-yellow-800 text-sm"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左：ユーザー情報・クレジット */}
          <div className="space-y-4">
            {/* ユーザー情報 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">アカウント情報</h2>
              <p className="text-sm text-gray-600 truncate">{userEmail}</p>
              <div className="mt-3 bg-indigo-50 rounded-lg px-4 py-3">
                <div className="text-xs text-indigo-600 font-medium">残クレジット</div>
                <div className="text-2xl font-bold text-indigo-700">{credits} <span className="text-sm font-normal">回</span></div>
              </div>
              <Link
                href="/ocr"
                className="mt-3 block text-center bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                OCR処理を行う
              </Link>
            </div>

            {/* クレジット購入 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">クレジットを購入</h2>
              <div className="space-y-3">
                {CREDIT_PACKS.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => handlePurchase(pack.id)}
                    disabled={purchaseLoading === pack.id}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-left hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pack.label}</div>
                        <div className="text-xs text-gray-500">{pack.credits}回分</div>
                      </div>
                      <div className="text-sm font-bold text-indigo-600">
                        {purchaseLoading === pack.id ? '処理中...' : `¥${pack.price.toLocaleString()}`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右：OCR履歴 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">OCR履歴</h2>
                <span className="text-sm text-gray-500">{tasks.length}件</span>
              </div>

              {tasks.length === 0 ? (
                <div className="px-5 py-12 text-center text-gray-500">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm">OCR履歴がありません</p>
                  <Link href="/ocr" className="mt-2 text-sm text-indigo-600 hover:underline inline-block">
                    最初の画像を処理する
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {tasks.map(task => (
                    <div key={task.id} className="px-5 py-4">
                      <div
                        className="flex items-start justify-between gap-3 cursor-pointer"
                        onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{task.filename}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(task.created_at)}</p>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {task.ocr_result.slice(0, 60)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(task) }}
                            className="text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 px-2 py-1 rounded transition-colors"
                          >
                            ⬇️
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(task.id) }}
                            disabled={deleteLoading === task.id}
                            className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                          >
                            {deleteLoading === task.id ? '削除中' : '🗑️'}
                          </button>
                        </div>
                      </div>

                      {/* 展開して全文表示 */}
                      {selectedTask?.id === task.id && (
                        <div className="mt-3">
                          <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {task.ocr_result}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
