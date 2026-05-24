import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 認証状態をチェックしてルートを保護するProxy（Next.js 16のmiddleware後継）
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 未ログインユーザーを保護されたルートからリダイレクト
  const protectedPaths = ['/mypage', '/ocr']
  const isProtectedPath = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ログイン済みユーザーがauth系ページにアクセスした場合はマイページへ
  const authPaths = ['/login', '/register']
  const isAuthPath = authPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/mypage'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
