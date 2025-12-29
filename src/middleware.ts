import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Check if the path is for a specific workspace
  const workspacePathRegex = /^\/dashboard\/workspaces\/([a-zA-Z0-9-]+)/
  const match = pathname.match(workspacePathRegex)

  if (match) {
    const workspaceId = match[1]
    
    // Set the cookie if it's not already set to the same value
    if (request.cookies.get('last-visited-workspace-id')?.value !== workspaceId) {
      response.cookies.set('last-visited-workspace-id', workspaceId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
      })
    }
  }

  return response
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/dashboard/:path*',
}
