import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// タスク一覧取得
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { data: tasks, error } = await supabase
      .from('ocr_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'タスクの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error('タスク取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

// タスク削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')

    if (!taskId) {
      return NextResponse.json({ error: 'タスクIDが必要です' }, { status: 400 })
    }

    // 自分のタスクのみ削除可能（RLSでも保護）
    const { error } = await supabase
      .from('ocr_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'タスクの削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('タスク削除エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
