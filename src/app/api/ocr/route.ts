import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// HEIC → JPEG変換（サーバーサイド）
async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer<ArrayBuffer>> {
  const heicConvert = await import('heic-convert')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convert = (heicConvert.default ?? heicConvert) as any
  const result = await convert({
    buffer: Buffer.from(buffer) as Buffer<ArrayBuffer>,
    format: 'JPEG',
    quality: 0.95,
  })
  return Buffer.from(result as ArrayBuffer) as Buffer<ArrayBuffer>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // クレジット残高チェック
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })
    }

    if (profile.credits <= 0) {
      return NextResponse.json(
        { error: 'クレジットが不足しています。クレジットを購入してください。' },
        { status: 402 }
      )
    }

    // アップロードファイルを取得
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: '画像ファイルが必要です' }, { status: 400 })
    }

    // ファイルサイズチェック（20MB上限）
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは20MB以下にしてください' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let imageBuffer: Buffer<any> = Buffer.from(arrayBuffer)
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
    const filename = file.name.toLowerCase()

    // HEIC形式の場合はJPEGに変換
    if (filename.endsWith('.heic') || filename.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
      imageBuffer = await convertHeicToJpeg(imageBuffer)
      mediaType = 'image/jpeg'
    } else if (filename.endsWith('.png') || file.type === 'image/png') {
      mediaType = 'image/png'
    } else if (filename.endsWith('.gif') || file.type === 'image/gif') {
      mediaType = 'image/gif'
    } else if (filename.endsWith('.webp') || file.type === 'image/webp') {
      mediaType = 'image/webp'
    }

    // Claude APIでOCR処理
    const base64Image = imageBuffer.toString('base64')

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `この画像に写っているテキストを全て正確に書き起こしてください。

以下のルールに従ってください：
- 画像に含まれる全てのテキストをそのまま書き起こす
- レイアウトや改行を可能な限り再現する
- 読み取れない文字は[?]と表記する
- テキスト以外の説明は不要（書き起こしたテキストのみ出力）
- 日本語・英語・その他の言語を問わずそのまま書き起こす`,
            },
          ],
        },
      ],
    })

    const ocrText = message.content[0].type === 'text' ? message.content[0].text : ''

    // クレジットを1消費
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id)

    if (updateError) {
      console.error('クレジット更新エラー:', updateError)
      return NextResponse.json({ error: 'クレジット更新に失敗しました' }, { status: 500 })
    }

    // OCR結果をDBに保存
    const { data: task, error: taskError } = await supabase
      .from('ocr_tasks')
      .insert({
        user_id: user.id,
        filename: file.name,
        ocr_result: ocrText,
      })
      .select()
      .single()

    if (taskError) {
      console.error('タスク保存エラー:', taskError)
    }

    return NextResponse.json({
      success: true,
      data: {
        text: ocrText,
        taskId: task?.id ?? null,
        creditsRemaining: profile.credits - 1,
      },
    })
  } catch (error) {
    console.error('OCR処理エラー:', error)
    return NextResponse.json(
      { error: 'OCR処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
