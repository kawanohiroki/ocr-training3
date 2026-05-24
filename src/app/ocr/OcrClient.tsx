'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface OcrClientProps {
  userEmail: string
  credits: number
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
]

export default function OcrClient({ userEmail, credits: initialCredits }: OcrClientProps) {
  const [credits, setCredits] = useState(initialCredits)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
    const isValidType = ACCEPTED_TYPES.includes(file.type) || isHeic

    if (!isValidType) {
      setError('対応していないファイル形式です（JPEG・PNG・GIF・WebP・HEICに対応）')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('ファイルサイズは20MB以下にしてください')
      return
    }

    setError('')
    setSelectedFile(file)
    setOcrResult('')

    // HEICはプレビュー不可のため代替表示
    if (isHeic) {
      setPreviewUrl(null)
    } else {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleOcr = async () => {
    if (!selectedFile) return
    if (credits <= 0) {
      setError('クレジットが不足しています。マイページからクレジットを購入してください。')
      return
    }

    setLoading(true)
    setError('')
    setOcrResult('')

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'OCR処理に失敗しました')
        return
      }

      setOcrResult(data.data.text)
      setCredits(data.data.creditsRemaining)
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!ocrResult) return
    const blob = new Blob([ocrResult], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ocr_${selectedFile?.name ?? 'result'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    if (!ocrResult) return
    await navigator.clipboard.writeText(ocrResult)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userEmail={userEmail} credits={credits} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">OCR テキスト起こし</h1>

        {credits <= 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-yellow-500 text-xl">⚠️</span>
            <div>
              <p className="font-medium text-yellow-800">クレジットが不足しています</p>
              <p className="text-sm text-yellow-700 mt-1">
                <Link href="/mypage" className="underline font-medium">マイページ</Link>
                からクレジットを購入してください。
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左：画像アップロード */}
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
              ) : selectedFile ? (
                <div className="py-8">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-700 font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 mt-1">HEIC形式はプレビューできません</p>
                </div>
              ) : (
                <div className="py-8">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-gray-700 font-medium">画像をドロップ</p>
                  <p className="text-sm text-gray-500 mt-1">またはクリックしてファイルを選択</p>
                  <p className="text-xs text-gray-400 mt-2">JPEG・PNG・GIF・WebP・HEIC対応（最大20MB）</p>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                <span>📎</span>
                <span className="truncate">{selectedFile.name}</span>
                <span className="text-gray-400 whitespace-nowrap">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}

            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              onClick={handleOcr}
              disabled={!selectedFile || loading || credits <= 0}
              className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  処理中... (クレジット1回消費)
                </>
              ) : (
                <>🔍 テキスト起こしを実行（1クレジット）</>
              )}
            </button>
          </div>

          {/* 右：OCR結果 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-700">OCR結果</h2>
              {ocrResult && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 px-2 py-1 rounded transition-colors"
                  >
                    📋 コピー
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 px-2 py-1 rounded transition-colors"
                  >
                    ⬇️ ダウンロード
                  </button>
                </div>
              )}
            </div>

            <textarea
              value={ocrResult}
              onChange={(e) => setOcrResult(e.target.value)}
              placeholder="画像をアップロードして「テキスト起こしを実行」ボタンを押すと、ここに結果が表示されます"
              className="w-full h-80 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />

            {ocrResult && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                {ocrResult.length} 文字
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/mypage" className="text-sm text-indigo-600 hover:underline">
            マイページで履歴を確認する →
          </Link>
        </div>
      </main>
    </div>
  )
}
