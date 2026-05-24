import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MypageClient from './MypageClient'

export default async function MypagePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // プロフィールとOCR履歴を取得
  const [{ data: profile }, { data: tasks }] = await Promise.all([
    supabase
      .from('profiles')
      .select('credits, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('ocr_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <MypageClient
      userEmail={user.email ?? ''}
      credits={profile?.credits ?? 0}
      tasks={tasks ?? []}
    />
  )
}
