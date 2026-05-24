import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OcrClient from './OcrClient'

export default async function OcrPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  return (
    <OcrClient
      userEmail={user.email ?? ''}
      credits={profile?.credits ?? 0}
    />
  )
}
